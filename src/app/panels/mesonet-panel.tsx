import React from "react";
import { Map as MapIcon } from "lucide-react";
import Image from "next/image";
import { LastUpdated } from "#/app/last-updated";
import { cn } from "#/lib/utils";
import { CurrentRadarTimestamp } from "./current-radar-timestamp";
import { getMapBounds } from "./map-bounds";
import { MapOverlay } from "./map-overlay";
import { Panel } from "./panel";

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
}): React.JSX.Element {
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const isDisabled = disabled || !hasCoordinates;

  return (
    <Panel
      aria-disabled={isDisabled}
      aria-label="Mesonet radar"
      className={cn(isDisabled && "pointer-events-none select-none opacity-50")}
      description={
        hasCoordinates ? (
          <p className="text-[0.625rem] text-muted-foreground">
            Updated <LastUpdated />
          </p>
        ) : null
      }
      icon={<MapIcon aria-hidden="true" className="size-3.5 text-white" />}
      title="Mesonet"
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
    </Panel>
  );
}
