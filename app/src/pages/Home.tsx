import { Box, Grid, Stack } from "@mui/material";
import CardNumber from "../components/CardNumber";
import CardSensorHistory from "../components/CardSensorHistory";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import { useEffect, useState } from "react";
import * as subscriptions from "../graphql/subscriptions";
import { Measurement } from "../types/measurement";
import { Container } from "@mui/system";
import CardHumidity from "../components/CardHumidity";
import CardTemperature from "../components/CardTemperature";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import useMeasurements from "../hooks/measurements";
import Loading from "../components/Loading";
import { convertToTimezonedTimestamp } from "../utils/datetime";
import { LIMIT, PERIOD, ROOM_NAME } from "../conf";
import useSubscribeMeasurement from "../hooks/subscription";
import CurrentTimeIndicator from "../components/CurrentTimeIndicator";
import moment from "moment-timezone";

const Contents = styled(Paper)(({ theme }) => ({
  ...theme.typography.h6,
  padding: theme.spacing(1),
  textAlign: "center",
}));

const Home: React.FC = () => {
  const from_ = moment(Date.now()).subtract(6, "hours").utc().format();
  const to_ = moment(Date.now()).utc().format();
  const { data, error, isLoading } = useMeasurements({
    roomName: ROOM_NAME,
    fromTimestamp: from_,
    toTimestamp: to_,
    freq: "10min",
  });

  const { currentMeasurement } = useSubscribeMeasurement();

  return (
    <>
      <CurrentTimeIndicator
        timestamp={convertToTimezonedTimestamp(currentMeasurement.timestamp)}
      ></CurrentTimeIndicator>
      <Grid container spacing={0}>
        <Grid item xs={4}>
          <CardHumidity value={currentMeasurement.humidity}></CardHumidity>
        </Grid>
        <Grid item xs={4}>
          <CardTemperature
            value={currentMeasurement.temperature}
          ></CardTemperature>
        </Grid>
        <Grid item xs={4}>
          <Contents>
            <CardNumber
              title={"気圧[Pa]"}
              value={currentMeasurement.pressure}
              precision={0}
            ></CardNumber>
          </Contents>
        </Grid>
      </Grid>
      <Stack direction={"column"}>
        {isLoading ? (
          <Loading></Loading>
        ) : (
          <>
            <CardSensorHistory
              data={data.map((x: Measurement) => {
                return [convertToTimezonedTimestamp(x.timestamp), x.humidity];
              })}
              measureName="humidity"
            ></CardSensorHistory>
            <CardSensorHistory
              data={data.map((x: Measurement) => {
                return [
                  convertToTimezonedTimestamp(x.timestamp),
                  x.temperature,
                ];
              })}
              measureName="temperature"
            ></CardSensorHistory>

            <CardSensorHistory
              data={data.map((x: Measurement) => {
                return [convertToTimezonedTimestamp(x.timestamp), x.pressure];
              })}
              measureName="pressure"
            ></CardSensorHistory>
          </>
        )}
      </Stack>
    </>
  );
};
export default Home;
