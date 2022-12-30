import CardSensorHistory from "../components/CardSensorHistory";
import { Measurement } from "../types/measurement";
import useMeasurements from "../hooks/measurements";
import Loading from "../components/Loading";
import { convertToTimezonedTimestamp } from "../utils/datetime";
import { LIMIT, PERIOD, ROOM_NAME } from "../conf";
import moment from "moment-timezone";

const RecentTrend: React.FC = () => {
  const from_ = moment(Date.now())
    .subtract(24, "hours")
    .utc()
    .format()
    .slice(0, -1);
  const to_ = moment(Date.now()).utc().format().slice(0, -1);
  console.log(from_);
  console.log(to_);

  const { data, error, isLoading } = useMeasurements({
    roomName: ROOM_NAME,
    fromTimestamp: from_,
    toTimestamp: to_,
    freq: "10min",
  });

  return (
    <>
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
              return [convertToTimezonedTimestamp(x.timestamp), x.temperature];
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
    </>
  );
};

export default RecentTrend;
