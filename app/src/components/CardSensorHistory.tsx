import ReactECharts from "echarts-for-react";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import { useEffect, useState } from "react";
import * as queries from "../graphql/queries";
import { convertToTimezonedTimestamp } from "../utils/datetime";
import { Card, CardContent } from "@mui/material";
import useMeasurements from "../hooks/measurements";

const getTitle = (measureName: string) => {
  const titles = {
    humidity: "湿度[%]",
    pressure: "気圧[Pa]",
    temperature: "気温[℃]",
  } as any;
  return titles[measureName];
};

const getColor = (measureName: string) => {
  const colors = {
    humidity: "#99f",
    pressure: "#fff",
    temperature: "#d33",
  } as any;
  return colors[measureName];
};

const CardSensorHistory: React.FC<{
  measureName: "humidity" | "pressure" | "temperature";
  data: any[];
}> = (props) => {
  const minValue = Math.min(...props.data.map((x: any) => x[1]));
  const maxValue = Math.max(...props.data.map((x: any) => x[1]));

  const option = {
    title: {
      text: getTitle(props.measureName),
    },
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "time",
    },
    yAxis: {
      type: "value",
      min: minValue,
      max: maxValue,
    },
    series: [
      {
        type: "line",
        name: props.measureName,
        // data: measurements,
        data: props.data,
        markLine: {
          data: [{ type: "average", name: "Avg" }],
        },
        lineStyle: { color: getColor(props.measureName) },
        itemStyle: { color: getColor(props.measureName) },
      },
    ],
  };
  return (
    <Card sx={{ m: 0, p: 0 }}>
      <CardContent>
        <ReactECharts
          option={option}
          style={{
            height: "200px",
          }}
          notMerge={true}
          lazyUpdate={true}
          theme={"dark"}
        />
      </CardContent>
    </Card>
  );
};
export default CardSensorHistory;
