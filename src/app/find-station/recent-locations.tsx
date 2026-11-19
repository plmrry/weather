import React from "react";
import { getLocationName } from "./geocode";
import { RecentLocationsClient } from "./recent-locations-client";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function RecentLocations({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const name = await getLocationName(params);

  return <RecentLocationsClient name={name || null} />;
}
