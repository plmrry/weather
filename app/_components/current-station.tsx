import type { JSX } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/_components/ui/card";
import { getLocationName, parseCoordinates } from "./find-station/geocode";
import { getStationObservation } from "./find-station/nws-observation";
import { LastUpdated } from "./last-updated";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function CurrentStation({ params }: { params?: Params }): Promise<JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const [name, observation] = coordinates
    ? await Promise.all([
        getLocationName(coordinates.latitude, coordinates.longitude),
        getStationObservation(coordinates.latitude, coordinates.longitude),
      ])
    : ["No station selected", null];

  return (
    <Card aria-label="Current station">
      <CardHeader>
        <CardTitle>Current station</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-full">
            <dt className="text-muted-foreground">Location name</dt>
            <dd className="font-medium">{name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Latitude</dt>
            <dd className="font-medium">{coordinates?.latitude ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Longitude</dt>
            <dd className="font-medium">{coordinates?.longitude ?? "—"}</dd>
          </div>
          <div className="col-span-full">
            <dt className="text-muted-foreground">Station name</dt>
            <dd className="font-medium">
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
            <dd className="font-medium">
              {observation ? <LastUpdated timestamp={observation.timestamp} /> : "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
