import AppBarMain from "./components/AppBarMain";
import Home from "./pages/Home";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function App() {
  return (
    <>
      {/* <ThemeProvider theme={darkTheme}>
        <CssBaseline /> */}
      <AppBarMain></AppBarMain>
      <Home />
      {/* </ThemeProvider> */}
    </>
  );
}

export default App;
