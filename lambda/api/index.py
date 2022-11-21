import json
import os
from datetime import datetime, timedelta
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr, Key

TABLE_NAME = os.environ.get("TABLE_NAME", "")
EXPIRATION_PERIOD_DAYS = 365 * 3
dynamo = boto3.resource("dynamodb")
table = dynamo.Table(TABLE_NAME)


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


def handler(event, context):
    field_name = event["info"]["fieldName"]
    arguments = event.get("arguments")
    if arguments:
        gql_input = arguments.get("input")

    if field_name == "getDemos":
        return [
            {"id": "AAA", "version": "v1.1.0"},
            {"id": "BBB", "version": "v1.1.1"},
        ]
    elif field_name == "getMeasurements":
        print(gql_input)
        room_name = gql_input["roomName"]
        from_timestamp = gql_input.get("fromTimestamp")
        to_timestamp = gql_input.get("toTimestamp")
        limit = gql_input.get("limit")
        period = gql_input.get("period")

        if limit:
            response = table.query(
                KeyConditionExpression=Key("room_name").eq(room_name),
                Limit=limit,
                ScanIndexForward=False,
            )
            # print(f'[DEBUG]: {response["Items"]}')
        elif from_timestamp is not None and to_timestamp is not None:
            response = table.query(
                KeyConditionExpression=Key("room_name").eq(room_name)
                & Key("timestamp").between(
                    convert_timestamp_to_epoch(datetime.fromisoformat(from_timestamp)),
                    convert_timestamp_to_epoch(datetime.fromisoformat(to_timestamp)),
                ),
            )
            # print(f'[DEBUG]: {response["Items"]}')
        else:
            raise Exception(
                "`limit` or `fromTimestamp` and `toTimestamp` must be givne"
            )

        items = response["Items"]

        # decimation
        if period:
            items = items[::period]

        # convert epoch to timestamp
        items = [
            item | {"timestamp": convert_epoch_to_timestamp(item["timestamp"])}
            for item in items
        ]

        # convert to camel case
        items = [convert_all_key_to_camel(item) for item in items]

        return items

    elif field_name == "postMeasurement":
        room_name = gql_input.get("roomName")
        timestamp_iso = gql_input.get("timestamp")
        temperature = gql_input.get("temperature")
        pressure = gql_input.get("pressure")
        humidity = gql_input.get("humidity")

        timestamp = datetime.fromisoformat(timestamp_iso)
        expiration = timestamp + timedelta(days=EXPIRATION_PERIOD_DAYS)

        # -----------------------
        # insert to dynamodb
        # -----------------------
        item = {
            "room_name": room_name,
            "timestamp": convert_timestamp_to_epoch(timestamp),
            "temperature": temperature,
            "pressure": pressure,
            "humidity": humidity,
            # NOTE: TTL attribute must be sec epoch.
            # reference: https://aws.amazon.com/jp/premiumsupport/knowledge-center/ttl-dynamodb/
            "expiration_timestamp": convert_timestamp_to_epoch(
                expiration, as_milisec=False
            ),
        }
        # parse float to decimal
        item = json.loads(json.dumps(item), parse_float=Decimal)

        try:
            response = table.put_item(Item=item)
            # print(f"[DEBUG] {response}")
        except Exception as e:
            print(f"[ERROR] {e}")

        # create response which is match to schema
        res = {
            "roomName": room_name,
            "timestamp": timestamp_iso,
            "temperature": temperature,
            "pressure": pressure,
            "humidity": humidity,
        }
        # print(f"[DEBUG] res: {res}")
        return res
    else:
        raise NotImplementedError()
