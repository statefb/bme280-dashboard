import useSWR from "swr";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import * as queries from "../graphql/queries";
import { REFLESH_INTERVAL } from "../conf";

export interface UseMeasurementProps {
  roomName: string;
  limit: number;
  period: number;
}

const fetcher = (query: string, input: any) => {
  return API.graphql({
    query: query,
    variables: {
      input: input,
    },
  }).then((res: any) => res.data.getMeasurements);
};

const useMeasurements = (props: UseMeasurementProps) => {
  const { data, error } = useSWR(
    queries.getMeasurements,
    (query) =>
      fetcher(query as unknown as string, {
        roomName: props.roomName,
        limit: props.limit,
        period: props.period,
      }),
    {
      revalidateOnFocus: false,
      refreshInterval: REFLESH_INTERVAL,
    }
  );

  // const isLoading = !error && !data;
  const isLoading = !data;

  return { data, error, isLoading };
};
export default useMeasurements;
