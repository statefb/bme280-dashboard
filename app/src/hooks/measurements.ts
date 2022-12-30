import useSWR from "swr";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import * as queries from "../graphql/queries";
import { REFLESH_INTERVAL } from "../conf";

export interface UseMeasurementProps {
  roomName: string;
  fromTimestamp: string;
  toTimestamp: string;
  freq: "1M" | "1W" | "1D" | "1H" | "5min" | "10min";
}

const fetcher = (query: string, input: any) => {
  return API.graphql({
    query: query,
    variables: {
      input: input,
    },
    authToken: import.meta.env.VITE_LAMBDA_API_KEY,
  }).then((res: any) => res.data.getMeasurements);
};

const useMeasurements = (props: UseMeasurementProps) => {
  const { data, error } = useSWR(
    props.freq, // cache key
    () =>
      fetcher(queries.getMeasurements as unknown as string, {
        roomName: props.roomName,
        fromTimestamp: props.fromTimestamp,
        toTimestamp: props.toTimestamp,
        freq: props.freq,
      }),
    {
      revalidateOnFocus: true,
      refreshInterval: REFLESH_INTERVAL,
    }
  );

  // const isLoading = !error && !data;
  const isLoading = !data;

  return { data, error, isLoading };
};
export default useMeasurements;
