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

type OnPostMeasurementEvent = {
  value: { data: { onPostMeasurement: any } };
};

const Contents = styled(Paper)(({ theme }) => ({
  ...theme.typography.h6,
  padding: theme.spacing(1),
  textAlign: "center",
}));

const Home: React.FC = () => {
  const [measurement, setMeasuremnt] = useState<Measurement>({
    temperature: 0.0,
    pressure: 0.0,
    humidity: 0.0,
    timestamp: "",
  });
  const { data, error, isLoading } = useMeasurements({
    roomName: ROOM_NAME,
    limit: LIMIT,
    period: PERIOD,
  });

  useEffect(() => {
    API.graphql({
      query: subscriptions.onPostMeasurement as unknown as string,
    }).subscribe({
      next: ({ value: { data } }: OnPostMeasurementEvent) => {
        setMeasuremnt(data.onPostMeasurement);
      },
      error: (error: any) => console.warn(error),
    });
  }, []);

  return (
    <>
      <Grid container spacing={0}>
        <Grid item xs={4}>
          <CardHumidity value={measurement.humidity}></CardHumidity>
        </Grid>
        <Grid item xs={4}>
          <CardTemperature value={measurement.temperature}></CardTemperature>
        </Grid>
        <Grid item xs={4}>
          <Contents>
            <CardNumber
              title={"気圧[Pa]"}
              value={measurement.pressure}
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
