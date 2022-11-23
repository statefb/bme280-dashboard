import { Measurement } from "../types/measurement";
import * as subscriptions from "../graphql/subscriptions";
import { Amplify, API, graphqlOperation } from "aws-amplify";
import { useEffect, useState } from "react";

type OnPostMeasurementEvent = {
  value: { data: { onPostMeasurement: any } };
};

const useSubscribeMeasurement = () => {
  const [measurement, setMeasuremnt] = useState<Measurement>({
    temperature: 0.0,
    pressure: 0.0,
    humidity: 0.0,
    timestamp: "",
  });

  useEffect(() => {
    API.graphql({
      query: subscriptions.onPostMeasurement as unknown as string,
      authToken: import.meta.env.VITE_LAMBDA_API_KEY,
    }).subscribe({
      next: ({ value: { data } }: OnPostMeasurementEvent) => {
        setMeasuremnt(data.onPostMeasurement);
      },
      error: (error: any) => console.warn(error),
    });
  }, []);

  return { currentMeasurement: measurement };
};

export default useSubscribeMeasurement;
