import { Card, CardContent, Typography } from "@mui/material";
import ReactECharts from "echarts-for-react";

const CardHumidity: React.FC<{
  value: number;
}> = (props) => {
  const option = {
    tooltip: {
      formatter: "{a} <br/>{b} : {c}%",
    },
    series: [
      {
        name: "Pressure",
        type: "gauge",
        detail: {
          formatter: "{value}",
          color: "auto",
        },
        axisLabel: {
          color: "auto",
          distance: -50,
          fontSize: 20,
        },
        data: [
          {
            value: props.value.toFixed(1),
            name: "湿度[%]",
          },
        ],
      },
    ],
  };
  return (
    <>
      <Card>
        <CardContent>
          <ReactECharts
            option={option}
            notMerge={true}
            lazyUpdate={true}
            theme={"dark"}
          />
        </CardContent>
      </Card>
    </>
  );
};
export default CardHumidity;
