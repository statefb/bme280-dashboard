import json
import os
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

import boto3
import pandas as pd
from boto3.dynamodb.conditions import Attr, Key

TABLE_NAME = os.environ.get("TABLE_NAME", "")
EXPIRATION_PERIOD_DAYS = 365 * 3
dynamo = boto3.resource("dynamodb")
table = dynamo.Table(TABLE_NAME)


def ave(data, freq: str):
    """average for time frequency.

    Args:
        data (list of dict): list of:
            {
                "timestamp": str in iso format
                ...
            }
        freq (str): frequency

    Returns:
        list of dict: list of:
            {
                "timestamp": str in iso format
                ...
            }
    """

    df = pd.DataFrame(data)
    df.index = pd.to_datetime(df["timestamp"])

    res = (
        df.groupby(pd.Grouper(freq=freq))
        .first()
        .assign(
            timestamp=lambda x: pd.to_datetime(x.index)
            .to_series()
            .apply(lambda y: y.isoformat())
        )
        .to_dict("records")
    )

    return res


def convert_timestamp_to_epoch(timestamp: datetime, as_milisec: bool = True) -> int:
    epoch = timestamp.timestamp()
    if as_milisec:
        epoch = epoch * 1000
    return int(epoch)


def convert_epoch_to_timestamp(epoch: Decimal, as_milisec: bool = True) -> str:
    if as_milisec:
        epoch = epoch / Decimal(1000.0)
    timestamp = datetime.fromtimestamp(epoch)
    return timestamp.isoformat()


def convert_snake_to_camel(source: str) -> str:
    # split underscore using split
    temp = source.split("_")
    # joining result
    res = temp[0] + "".join(ele.title() for ele in temp[1:])
    return res


def convert_all_key_to_camel(d: dict) -> dict:
    res = {}
    for k, v in d.items():
        res[convert_snake_to_camel(k)] = v
    return res


def ddb_query(
    d: datetime.date, freq: str, from_: str, to_: str, room_name: str
) -> List:
    print(f"[DEBUG] : {d.isoformat()}")
    print(f"[DEBUG] : {convert_timestamp_to_epoch(from_)}")
    print(f"[DEBUG] : {convert_timestamp_to_epoch(to_)}")
    print(f"[DEBUG] : {room_name}")
    print(f"[DEBUG] start query for: {d}")
    response = table.query(
        KeyConditionExpression=Key("date").eq(d.isoformat())
        & Key("timestamp").between(
            convert_timestamp_to_epoch(from_),
            convert_timestamp_to_epoch(to_),
        ),
        # Limit=limit,
        ScanIndexForward=False,
        FilterExpression=Attr("room_name").eq(room_name),
    )
    print(f"[DEBUG] end query for: {d}")
    items = response["Items"]
    if len(items) == 0:
        return []

    items = [
        item | {"timestamp": convert_epoch_to_timestamp(item["timestamp"])}
        for item in items
    ]

    print(f"[DEBUG] start conversion for: {d}")
    items_ave = ave(items, freq=freq)
    print(f"[DEBUG] end conversion for: {d}")

    return items_ave


def handler(event, context):
    field_name = event["info"]["fieldName"]
    arguments = event.get("arguments")
    if arguments:
        gql_input = arguments.get("input")

    if field_name == "getMeasurements":
        room_name = gql_input["roomName"]
        from_timestamp = gql_input.get("fromTimestamp")
        to_timestamp = gql_input.get("toTimestamp")
        freq = gql_input.get("freq")

        VALID_FREQ = ("1H", "1D", "1W", "1M", "5min", "10min")
        assert freq in VALID_FREQ, f"`freq` must be one of: {VALID_FREQ}"

        from_ = datetime.fromisoformat(from_timestamp)
        to_ = datetime.fromisoformat(to_timestamp)
        now = datetime.now()
        day_range = [
            from_.date() + timedelta(days=d) for d in range((to_ - from_).days + 1)
        ]

        dat = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for d in day_range:
                print(f"[DEBUG] submit task for: {d}")
                futures.append(
                    executor.submit(ddb_query, d, freq, from_, to_, room_name)
                )
            for f in futures:
                dat.extend(f.result())

        print(f"[DEBUG] items start: {dat[0]}")

        # convert to camel case
        items = [convert_all_key_to_camel(item) for item in dat]

        return items
    else:
        raise NotImplementedError()
