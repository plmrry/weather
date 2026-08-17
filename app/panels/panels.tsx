import type { JSX } from "react";
import { MesonetPanel } from "./mesonet-panel";

export async function Panels({
  searchParams,
}: Pick<PageProps<"/">, "searchParams">): Promise<JSX.Element> {
  const { latitude, longitude } = await searchParams;
  const parsedLatitude = typeof latitude === "string" ? Number(latitude) : Number.NaN;
  const parsedLongitude = typeof longitude === "string" ? Number(longitude) : Number.NaN;
  const coordinatesAreValid =
    Number.isFinite(parsedLatitude) &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    Number.isFinite(parsedLongitude) &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  return (
    <MesonetPanel
      latitude={coordinatesAreValid ? parsedLatitude : undefined}
      longitude={coordinatesAreValid ? parsedLongitude : undefined}
    />
  );
}
