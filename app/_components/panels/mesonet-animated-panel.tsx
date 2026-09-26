import { Radar as RadarIcon } from "lucide-react";
import type { JSX } from "react";
import { AspectRatio } from "#/app/_components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/_components/ui/card";
import { cn } from "#/lib/utils";
import { LastUpdated } from "#/app/_components/last-updated";
import { AnimatedRadar } from "./animated-radar";
import { MapOverlay } from "./map-overlay";

export function MesonetAnimatedPanel({
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
      aria-label="Mesonet animated radar"
      className={cn(isDisabled && "pointer-events-none select-none opacity-50")}
    >
      <CardHeader className="flex flex-col gap-1">
        <div className="flex flex-row items-center gap-1.5">
          <RadarIcon aria-hidden="true" className="size-3.5 text-accent" />
          <CardTitle>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Mesonet Animated
            </h2>
          </CardTitle>
        </div>
        {hasCoordinates ? (
          <p className="text-[0.625rem] text-muted-foreground">
            Updated <LastUpdated />
          </p>
        ) : null}
      </CardHeader>

      <CardContent>
        <AspectRatio
          ratio={1}
          aria-label={
            isDisabled
              ? "Mesonet animated radar unavailable until a location is selected"
              : "Animated Mesonet radar loop near the selected location"
          }
          className="mx-auto flex w-full max-w-md items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-black"
          role="img"
        >
          {hasCoordinates ? (
            <>
              <AnimatedRadar latitude={latitude} longitude={longitude} />
              <MapOverlay latitude={latitude} longitude={longitude} />
            </>
          ) : (
            <RadarIcon aria-hidden="true" className="size-10 text-muted-foreground" />
          )}
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
