import ReactECharts from "echarts-for-react";

const CardSensor: React.FC = () => {
  const option = {
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: [150, 230, 224, 218, 135, 147, 260],
        type: "line",
      },
    ],
  };
  return (
    <ReactECharts
      option={option}
      notMerge={true}
      lazyUpdate={true}
      theme={"vintage"}
      //   onChartReady={this.onChartReadyCallback}
      //   onEvents={EventsDict}
      //   opts={}
    />
  );
};
export default CardSensor;
