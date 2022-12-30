import json
import os
from datetime import datetime, timedelta
from decimal import Decimal
from typing import List

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


def handler(event, context):
    field_name = event["info"]["fieldName"]
    arguments = event.get("arguments")
    if arguments:
        gql_input = arguments.get("input")

    if field_name == "postMeasurement":
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
            # partition key
            "date": timestamp.date().isoformat(),
            # sort key
            "timestamp": convert_timestamp_to_epoch(timestamp),
            # other attributes
            "room_name": room_name,
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
