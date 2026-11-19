import React from "react";
import { LoaderCircle, RadioTower } from "lucide-react";
import { fetchStationData } from "../fetch-station-data";
import { LastUpdated } from "../last-updated";
import { Section } from "../section";
import { getLocationName, parseCoordinates } from "./find-station/geocode";

export function CurrentStation({
  params,
}: {
  params?: Promise<{ latitude: string; longitude: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense
      fallback={<CurrentStationRendered fallback />}
      name="CurrentStation"
    >
      <CurrentStationRendered params={params} />
    </React.Suspense>
  );
}

async function CurrentStationRendered({
  fallback = false,
  params,
}: {
  fallback?: boolean;
  params?: Promise<{ latitude: string; longitude: string }>;
}): Promise<React.JSX.Element> {
  const coordinates = parseCoordinates(
    !fallback && params ? await params : undefined,
  );
  const [name, station] = coordinates
    ? await Promise.all([getLocationName(params), fetchStationData(params)])
    : ["No station selected", null];

  return (
    <Section
      aria-busy={fallback}
      ariaLabel="Current station"
      icon={<RadioTower aria-hidden="true" className="size-4" />}
      title="Current station"
    >
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
          <dt className="text-muted-foreground">Radar data last received</dt>
          <dd className="font-medium text-foreground">
            {station ? <LastUpdated timestamp={station.timestamp} /> : "—"}
          </dd>
        </div>
      </dl>
      {fallback ? (
        <div
          aria-label="Loading current station"
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/50 text-white"
          role="status"
        >
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
        </div>
      ) : null}
    </Section>
  );
}
