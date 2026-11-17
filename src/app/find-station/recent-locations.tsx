import React from "react";
import { getLocationName, parseCoordinates } from "./geocode";
import { RecentLocationsClient } from "./recent-locations-client";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function RecentLocations({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const name = coordinates
    ? await getLocationName(coordinates.latitude, coordinates.longitude)
    : "";

  return <RecentLocationsClient name={name || null} />;
}
