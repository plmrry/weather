import { Map as MapIcon } from "lucide-react";
import Image from "next/image";
import type { JSX } from "react";
import { AspectRatio } from "#/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { cn } from "#/lib/utils";
import { MapOverlay } from "./map-overlay";

function getMesonetImageUrl(latitude: number, longitude: number): string {
  const bbox = [longitude - 2, latitude - 2, longitude + 2, latitude + 2];
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
      <CardHeader className="flex flex-row items-center gap-1.5">
        <MapIcon aria-hidden="true" className="size-3.5 text-accent" />
        <CardTitle>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Mesonet
          </h2>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <AspectRatio
          ratio={1}
          aria-label={
            isDisabled
              ? "Mesonet map unavailable until a location is selected"
              : "Current Mesonet radar near the selected location"
          }
          className="mx-auto flex w-full max-w-md items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-black"
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
            </>
          ) : (
            <MapIcon aria-hidden="true" className="size-10 text-muted-foreground" />
          )}
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
