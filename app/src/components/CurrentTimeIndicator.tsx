import { Typography } from "@mui/material";

const CurrentTimeIndicator: React.FC<{ timestamp: string }> = ({
  timestamp,
}) => {
  return <Typography variant={"h6"}>last update: {timestamp}</Typography>;
};
export default CurrentTimeIndicator;
