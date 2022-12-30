import { Box, Grid, Stack } from "@mui/material";
import CardNumber from "../components/CardNumber";
import CardHumidity from "../components/CardHumidity";
import CardTemperature from "../components/CardTemperature";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import { convertToTimezonedTimestamp } from "../utils/datetime";
import { LIMIT, PERIOD, ROOM_NAME } from "../conf";
import useSubscribeMeasurement from "../hooks/subscription";
import CurrentTimeIndicator from "../components/CurrentTimeIndicator";
import RecentTrend from "../components/RecentTrend";
import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useState } from "react";
import PastTrend from "../components/PastTrend";

const Contents = styled(Paper)(({ theme }) => ({
  ...theme.typography.h6,
  padding: theme.spacing(1),
  textAlign: "center",
}));

const Home: React.FC = () => {
  const { currentMeasurement } = useSubscribeMeasurement();
  const [checked, setChecked] = useState(true);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked);
  };

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
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={checked} onChange={handleChange} />}
            label="直近24時間"
          />
        </FormGroup>
        {checked ? <RecentTrend></RecentTrend> : <PastTrend></PastTrend>}
      </Stack>
    </>
  );
};
export default Home;
