import type { JSX } from "react";
import { MesonetAnimatedPanel } from "./mesonet-animated-panel";
import { MesonetPanel } from "./mesonet-panel";

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

  return (
    <>
      <MesonetPanel
        latitude={coordinatesAreValid ? parsedLatitude : undefined}
        longitude={coordinatesAreValid ? parsedLongitude : undefined}
      />
      <MesonetAnimatedPanel
        latitude={coordinatesAreValid ? parsedLatitude : undefined}
        longitude={coordinatesAreValid ? parsedLongitude : undefined}
      />
    </>
  );
}
