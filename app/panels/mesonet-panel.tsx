import { Map as MapIcon } from "lucide-react";
import Image from "next/image";
import type { JSX } from "react";
import { LastUpdated } from "#/app/last-updated";
import { AspectRatio } from "#/app/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/ui/card";
import { cn } from "#/lib/utils";
import { CurrentRadarTimestamp } from "./current-radar-timestamp";
import { getMapBounds } from "./map-bounds";
import { MapOverlay } from "./map-overlay";

function getMesonetImageUrl(latitude: number, longitude: number): string {
  const bbox = getMapBounds(latitude, longitude);
  const searchParams = new URLSearchParams({
    BBOX: bbox.join(","),
    FORMAT: "image/png",
    HEIGHT: "600",
    LAYERS: "nexrad-n0q",
    REQUEST: "GetMap",
    SERVICE: "WMS",
    SRS: "EPSG:4326",
    TRANSPARENT: "true",
    VERSION: "1.1.1",
    WIDTH: "600",
  });

  return `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?${searchParams}`;
}

export function MesonetPanel({
  disabled = false,
  latitude,
  longitude,
}: {
  disabled?: boolean;
  latitude?: number;
  longitude?: number;
}): JSX.Element {
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const isDisabled = disabled || !hasCoordinates;

  return (
    <Card
      aria-disabled={isDisabled}
      aria-label="Mesonet radar"
      className={cn(isDisabled && "pointer-events-none select-none opacity-50")}
    >
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="flex flex-col gap-1 px-0">
          <div className="flex flex-row items-center gap-1.5">
            <MapIcon aria-hidden="true" className="size-3.5 text-white" />
            <CardTitle>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Mesonet
              </h2>
            </CardTitle>
          </div>
          {hasCoordinates ? (
            <p className="text-[0.625rem] text-muted-foreground">
              Updated <LastUpdated />
            </p>
          ) : null}
        </CardHeader>

        <AspectRatio
          ratio={1}
          aria-label={
            isDisabled
              ? "Mesonet map unavailable until a location is selected"
              : "Current Mesonet radar near the selected location"
          }
          className="flex w-full items-center justify-center overflow-hidden rounded-md border border-white bg-black"
          role="img"
        >
          {hasCoordinates ? (
            <>
              <Image
                alt="Current Mesonet base-reflectivity radar near the selected location"
                className="size-full object-cover"
                height={600}
                sizes="(max-width: 512px) calc(100vw - 4rem), 448px"
                src={getMesonetImageUrl(latitude, longitude)}
                width={600}
              />
              <MapOverlay latitude={latitude} longitude={longitude} />
              <CurrentRadarTimestamp />
            </>
          ) : (
            <MapIcon aria-hidden="true" className="size-10 text-muted-foreground" />
          )}
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
