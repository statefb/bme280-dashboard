import json
import os
from datetime import datetime, timedelta
from decimal import Decimal

import boto3
import requests
from requests_aws_sign import AWSV4Sign

TABLE_NAME = os.environ.get("TABLE_NAME", "")
APPSYNC_URL = os.environ.get("APPSYNC_URL", "")
dynamo = boto3.resource("dynamodb")
table = dynamo.Table(TABLE_NAME)


def convert_timestamp_to_epoch(timestamp: datetime, as_milisec: bool = True) -> int:
    epoch = timestamp.timestamp()
    if as_milisec:
        epoch = epoch * 1000
    return int(epoch)


def gql_query(query: str, variables: dict):
    # reference: https://gist.github.com/kcwinner/20742479a42d9caa9b4a006504289c9f

    session = boto3.session.Session()
    credentials = session.get_credentials()
    region = session.region_name or "ap-northeast-1"

    endpoint = APPSYNC_URL
    headers = {"Content-Type": "application/json"}
    payload = {"query": query, "variables": variables}

    appsync_region = __parse_region_from_url(endpoint) or region

    auth = AWSV4Sign(credentials, appsync_region, "appsync")

    try:
        response = requests.post(
            endpoint, auth=auth, json=payload, headers=headers
        ).json()
        if "errors" in response:
            print(f'[ERROR] attempting to query AppSync: {response["errors"]}')
        else:
            # print(f"[DEBUG] response: {response}")
            return response
    except Exception as ex:
        print(f"[ERROR] {ex}")

    return None


def __parse_region_from_url(url):
    """Parses the region from the appsync url so we call the correct region regardless of the session or the argument"""
    # Example URL: https://xxxxxxx.appsync-api.us-east-2.amazonaws.com/graphql
    split = url.split(".")
    if 2 < len(split):
        return split[2]
    return None


def handler(event, context):
    gql_input = {
        "humidity": event["hum"],
        "pressure": event["pres"],
        "roomName": event["room_name"],
        "temperature": event["temp"],
        "timestamp": event["timestamp"],
    }

    query = """
    mutation PostMeasurement (
        $input: MeasurementInput!
    ){
        postMeasurement(input: $input){
            humidity
            pressure
            roomName
            temperature
            timestamp
        }
    }
    """
    res = gql_query(query, {"input": gql_input})
