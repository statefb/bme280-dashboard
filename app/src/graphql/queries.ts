import { gql } from "@apollo/client";

export const getMeasurements = gql`
  query GetMeasurements($input: MeasurementQueryInput) {
    getMeasurements(input: $input) {
      humidity
      pressure
      roomName
      timestamp
      temperature
    }
  }
`;
