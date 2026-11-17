import React from "react";
import { FindStationFormClient } from "./find-station-form-client";
import { getLocationName, parseCoordinates } from "./geocode";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function FindStationForm({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const initialQuery = coordinates
    ? await getLocationName(coordinates.latitude, coordinates.longitude)
    : "";

  return <FindStationFormClient initialQuery={initialQuery} />;
}
