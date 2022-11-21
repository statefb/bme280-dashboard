import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as echarts from "echarts";

/**
 * import themes for echarts
 */
import dark from "./echart-themes/dark";
echarts.registerTheme("dark", dark);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
