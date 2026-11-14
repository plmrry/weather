import type { JSX } from "react";
import { AspectRatio } from "#/app/_components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/_components/ui/card";
import { MapOverlay } from "./map-overlay";
import { MesonetAnimatedPanel } from "./mesonet-animated-panel";
import { MesonetPanel } from "./mesonet-panel";

const AUSTIN_LATITUDE = 30.2672;
const AUSTIN_LONGITUDE = -97.7431;

function AustinPanel(): JSX.Element {
  return (
    <Card aria-label="new 1">
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="px-0">
          <CardTitle>
            <h2 className="text-xs font-semibold tracking-wider text-foreground">new 1</h2>
          </CardTitle>
        </CardHeader>
        <AspectRatio
          aria-label="Austin, Texas street map without radar data"
          className="relative w-full overflow-hidden rounded-md border border-white bg-black"
          ratio={1}
          role="img"
        >
          <MapOverlay
            latitude={AUSTIN_LATITUDE}
            longitude={AUSTIN_LONGITUDE}
            projection="stereographic"
          />
        </AspectRatio>
      </CardContent>
    </Card>
  );
}

function NewPanel({ label }: { label: string }): JSX.Element {
  return (
    <Card aria-label={label}>
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="px-0">
          <CardTitle>
            <h2 className="text-xs font-semibold tracking-wider text-foreground">{label}</h2>
          </CardTitle>
        </CardHeader>
        <AspectRatio
          aria-label={`${label} placeholder`}
          className="w-full rounded-md border border-border bg-black"
          ratio={1}
          role="img"
        />
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
      <AustinPanel />
      <NewPanel label="new 2" />
    </>
  );
}
