import type { JSX } from "react";
import { getLocationName, parseCoordinates } from "./geocode";
import { FindStationFormClient } from "./find-station-form-client";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function FindStationForm({ params }: { params?: Params }): Promise<JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const initialQuery = coordinates
    ? await getLocationName(coordinates.latitude, coordinates.longitude)
    : "";

  return <FindStationFormClient initialQuery={initialQuery} />;
}
