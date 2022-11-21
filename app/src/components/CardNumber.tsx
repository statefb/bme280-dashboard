import { Card, CardContent, Typography } from "@mui/material";

const CardNumber: React.FC<{
  title: string;
  value: number;
  precision: number;
}> = (props) => {
  return (
    <>
      <Card>
        <CardContent>
          <Typography sx={{ fontsize: 14 }} color="text.secondary">
            {props.title}
          </Typography>
          <Typography variant="h4">
            {props.value.toFixed(props.precision)}
          </Typography>
        </CardContent>
      </Card>
    </>
  );
};
export default CardNumber;
