import {
  AppBar,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import React from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";

export default function AppBarMain() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <DashboardIcon />
          <Typography variant="h4" style={{ flexGrow: 1 }}>
            Home Environment Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
