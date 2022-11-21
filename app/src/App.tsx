import AppBarMain from "./components/AppBarMain";
import Home from "./pages/Home";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Amplify, API, graphqlOperation } from "aws-amplify";

Amplify.configure({
  aws_appsync_graphqlEndpoint: import.meta.env.VITE_APPSYNC_ENDPOINT,
  aws_appsync_region: import.meta.env.VITE_APPSYNC_REGION,
  aws_appsync_authenticationType: "API_KEY",
  aws_appsync_apiKey: import.meta.env.VITE_APPSYNC_API_KEY,
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  return (
    <>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AppBarMain></AppBarMain>
        <Home />
      </ThemeProvider>
    </>
  );
}

export default App;
