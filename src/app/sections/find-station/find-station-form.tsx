import React from "react";
import { FindStationFormClient } from "./find-station-form-client";
import { getLocationName } from "./geocode";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function FindStationForm({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const initialQuery = (await getLocationName(params)) ?? "";

  return <FindStationFormClient initialQuery={initialQuery} />;
}
