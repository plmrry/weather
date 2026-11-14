import type { JSX } from "react";
import { AspectRatio } from "#/app/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/ui/card";
import { MapOverlay } from "./map-overlay";
import { MesonetAnimatedPanel } from "./mesonet-animated-panel";
import { MesonetPanel } from "./mesonet-panel";

function NewMapPanel({
  label,
  latitude,
  location,
  longitude,
}: {
  label: string;
  latitude: number;
  location: string;
  longitude: number;
}): JSX.Element {
  return (
    <Card aria-label={label}>
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="px-0">
          <CardTitle>
            <h2 className="text-xs font-semibold tracking-wider text-foreground">{label}</h2>
          </CardTitle>
        </CardHeader>
        <AspectRatio
          aria-label={`${location} map without radar data`}
          className="relative w-full overflow-hidden rounded-md border border-white bg-black"
          ratio={1}
          role="img"
        >
          <MapOverlay latitude={latitude} longitude={longitude} projection="stereographic" />
        </AspectRatio>
      </CardContent>
    </Card>
  );
}

export async function Panels({
  params,
}: {
  params?: Promise<{ latitude: string; longitude: string }>;
}): Promise<JSX.Element> {
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

  return (
    <>
      <MesonetPanel
        disabled={disabled}
        latitude={coordinatesAreValid ? parsedLatitude : undefined}
        longitude={coordinatesAreValid ? parsedLongitude : undefined}
      />
      <MesonetAnimatedPanel
        disabled={disabled}
        latitude={coordinatesAreValid ? parsedLatitude : undefined}
        longitude={coordinatesAreValid ? parsedLongitude : undefined}
      />
      <NewMapPanel label="new 1" latitude={30.2672} location="Austin, Texas" longitude={-97.7431} />
      <NewMapPanel label="new 2" latitude={59.9139} location="Oslo, Norway" longitude={10.7522} />
      <NewMapPanel
        label="new 3"
        latitude={61.2181}
        location="Anchorage, Alaska"
        longitude={-149.9003}
      />
    </>
  );
}
