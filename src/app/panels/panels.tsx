import React from "react";
import { Map as MapIcon } from "lucide-react";
import { getCoordinates, getLocationName } from "#/app/find-station/geocode";
import { LastUpdated } from "#/app/last-updated";
import { AspectRatio } from "#/app/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/ui/card";
import { MapOverlay } from "./map-overlay";
import { MesonetPanel } from "./mesonet-panel";
import { NexradData } from "./nexrad-data";
import {
  RadarDataSummary,
  RadarPanelsClient,
  RadarSvgLayer,
} from "./radar-panel-client";

const RADAR_DATA_ENABLED = false;

const newMapDefinitions = [
  { id: "new-1", label: "Austin, Texas", location: "Austin, Texas" },
  {
    id: "new-2",
    label: "Spokane, Washington",
    location: "Spokane, Washington",
  },
  { id: "new-3", label: "Anchorage, Alaska", location: "Anchorage, Alaska" },
  {
    id: "new-4",
    label: "Burlington, Vermont",
    location: "Burlington, Vermont",
  },
] as const;

function NewMapPanel({
  id,
  label,
  latitude,
  location,
  longitude,
  renderRadarData = false,
}: {
  id: string;
  label: string;
  latitude: number;
  location: string;
  longitude: number;
  renderRadarData?: boolean;
}): React.JSX.Element {
  return (
    <Card aria-label={label}>
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="flex flex-col gap-1 px-0">
          <div className="flex flex-row items-center gap-1.5">
            <MapIcon aria-hidden="true" className="size-3.5 text-white" />
            <CardTitle>
              <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
                {label}
              </h2>
            </CardTitle>
          </div>
          <p className="text-[0.625rem] text-muted-foreground">
            Updated <LastUpdated />
          </p>
        </CardHeader>
        {renderRadarData ? <RadarDataSummary id={id} /> : null}
        <AspectRatio
          aria-label={`${location} map${renderRadarData ? " with radar data" : " without radar data"}`}
          className="relative w-full overflow-hidden rounded-md border border-white bg-black"
          ratio={1}
          role="img"
        >
          <React.Suspense fallback={<MapLoadingSpinner location={location} />}>
            <MapOverlay
              latitude={latitude}
              longitude={longitude}
              projection="satellite"
              radarLayer={renderRadarData ? <RadarSvgLayer id={id} /> : null}
            />
          </React.Suspense>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}

function MapLoadingSpinner({
  location,
}: {
  location: string;
}): React.JSX.Element {
  return (
    <div
      aria-label={`${location} map loading`}
      className="absolute inset-0 flex items-center justify-center bg-black"
      role="status"
    >
      <span
        aria-hidden="true"
        className="size-8 animate-spin rounded-full border-4 border-white border-r-transparent"
      />
    </div>
  );
}

export async function Panels({
  params,
}: {
  params?: Promise<{ latitude: string; longitude: string }>;
}): Promise<React.JSX.Element> {
  const resolved = params ? await params : undefined;
  const parsedLatitude = resolved ? Number(resolved.latitude) : Number.NaN;
  const parsedLongitude = resolved ? Number(resolved.longitude) : Number.NaN;
  const coordinatesAreValid =
    Number.isFinite(parsedLatitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    Number.isFinite(parsedLongitude) &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;
  const disabled = params === undefined;
  const [currentLocationName, newMaps] = await Promise.all([
    coordinatesAreValid
      ? getLocationName(parsedLatitude, parsedLongitude)
      : Promise.resolve(null),
    Promise.all(
      newMapDefinitions.map(async (definition) => ({
        ...definition,
        ...(await getCoordinates(definition.location)),
      })),
    ),
  ]);
  const radarCoordinates = [
    ...(coordinatesAreValid
      ? [
          {
            id: "mesonet",
            latitude: parsedLatitude,
            longitude: parsedLongitude,
          },
        ]
      : []),
    ...newMaps.map(({ id, latitude, longitude }) => ({
      id,
      latitude,
      longitude,
    })),
  ];

  const mapPanels = (
    <>
      {coordinatesAreValid && currentLocationName ? (
        <NewMapPanel
          id="mesonet"
          label={currentLocationName}
          latitude={parsedLatitude}
          location={currentLocationName}
          longitude={parsedLongitude}
          renderRadarData={RADAR_DATA_ENABLED}
        />
      ) : (
        <MesonetPanel disabled={disabled} />
      )}
      {newMaps.map(({ id, label, latitude, location, longitude }) => (
        <NewMapPanel
          id={id}
          key={id}
          label={label}
          latitude={latitude}
          location={location}
          longitude={longitude}
          renderRadarData={RADAR_DATA_ENABLED}
        />
      ))}
      <NexradData />
    </>
  );

  return RADAR_DATA_ENABLED ? (
    <RadarPanelsClient coordinates={radarCoordinates}>
      {mapPanels}
    </RadarPanelsClient>
  ) : (
    mapPanels
  );
}
