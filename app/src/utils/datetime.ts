import moment from "moment-timezone";

const TIMEZONE = "Asia/Tokyo";

export const convertToTimezonedTimestamp = (ts: string) => {
  const tsz = ts + "Z";
  const res = moment(tsz).tz(TIMEZONE).format();
  return res;
};
