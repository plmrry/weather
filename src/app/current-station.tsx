import React from "react";
import Card from "#/app/ui/card";
import { fetchStationData } from "./fetch-station-data";
import { getLocationName, parseCoordinates } from "./find-station/geocode";
import { LastUpdated } from "./last-updated";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function CurrentStation({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const [name, station] = coordinates
    ? await Promise.all([getLocationName(params), fetchStationData(params)])
    : ["No station selected", null];

  return (
    <section aria-label="Current station">
      <Card.Root>
        <Card.Header>
          <Card.Title>Current station</Card.Title>
        </Card.Header>
        <Card.Description>
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
                {station ? station.stationName : "—"}
                {station ? (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {station.stationId}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="col-span-full">
              <dt className="text-muted-foreground">
                Radar data last received
              </dt>
              <dd className="font-medium text-foreground">
                {station ? <LastUpdated timestamp={station.timestamp} /> : "—"}
              </dd>
            </div>
          </dl>
        </Card.Description>
      </Card.Root>
    </section>
  );
}
