import { gql } from "@apollo/client";

export const onPostMeasurement = gql`
  subscription OnPostMeasurement {
    onPostMeasurement {
      humidity
      pressure
      roomName
      timestamp
      temperature
    }
  }
`;
