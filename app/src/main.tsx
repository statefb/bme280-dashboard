import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as echarts from "echarts";

/**
 * import themes for echarts
 */
import dark from "./echart-themes/dark.json";
import chalk from "./echart-themes/chalk.json";
import default_theme from "./echart-themes/default.json";
import essos from "./echart-themes/essos.json";
import vintage from "./echart-themes/vintage.json";
import halloween from "./echart-themes/halloween.json";
import infographic from "./echart-themes/infographic.json";
import purplePassion from "./echart-themes/purple-passion.json";
import walden from "./echart-themes/walden.json";

echarts.registerTheme("dark", dark.theme);
echarts.registerTheme("chalk", chalk.theme);
echarts.registerTheme("default", default_theme.theme);
echarts.registerTheme("essos", essos.theme);
echarts.registerTheme("vintage", vintage.theme);
echarts.registerTheme("halloween", halloween.theme);
echarts.registerTheme("infographic", infographic.theme);
echarts.registerTheme("purple-passion", purplePassion.theme);
echarts.registerTheme("walden", walden.theme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
