import React from "react";
import Card from "#/app/ui/card";
import { getLocationName, parseCoordinates } from "./find-station/geocode";
import { getStationData } from "./get-station-data";
import { LastUpdated } from "./last-updated";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function CurrentStation({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const [name, observation] = coordinates
    ? await Promise.all([
        getLocationName(coordinates.latitude, coordinates.longitude),
        getStationData(coordinates),
      ])
    : ["No station selected", null];

  return (
    <Card.Root aria-label="Current station">
      <Card.Content className="mx-auto w-full max-w-md">
        <Card.Header className="px-0 py-4">
          <Card.Title>Current station</Card.Title>
        </Card.Header>
        <Card.Description className="px-0">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-full">
              <dt className="text-muted-foreground">Location name</dt>
              <dd className="font-medium text-foreground">{name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Latitude</dt>
              <dd className="font-medium text-foreground">
                {coordinates?.latitude ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Longitude</dt>
              <dd className="font-medium text-foreground">
                {coordinates?.longitude ?? "—"}
              </dd>
            </div>
            <div className="col-span-full">
              <dt className="text-muted-foreground">Station name</dt>
              <dd className="font-medium text-foreground">
                {observation ? observation.stationName : "—"}
                {observation ? (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {observation.stationId}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="col-span-full">
              <dt className="text-muted-foreground">Last updated</dt>
              <dd className="font-medium text-foreground">
                {observation ? (
                  <LastUpdated timestamp={observation.timestamp} />
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </Card.Description>
      </Card.Content>
    </Card.Root>
  );
}
