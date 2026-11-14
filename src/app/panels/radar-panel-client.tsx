"use client";

import React from "react";
import type {
  RadarPanelCoordinates,
  RadarPanelResult,
  RadarPanelsActionState,
} from "./radar-actions";
import { loadRadarOverlays } from "./radar-actions";

const MAP_DIMENSION = 600;

type RadarPanelsContextValue = {
  pending: boolean;
  results: RadarPanelResult[];
};

const RadarPanelsContext = React.createContext<null | RadarPanelsContextValue>(
  null,
);

function useRadarPanel(id: string): {
  pending: boolean;
  result: RadarPanelResult | undefined;
} {
  const context = React.useContext(RadarPanelsContext);
  if (!context) throw new Error("Radar panels context is unavailable");
  return {
    pending: context.pending,
    result: context.results.find((result) => result.id === id),
  };
}

function formatDataSize(bytes: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  });

  if (bytes < 1024) return `${formatter.format(bytes)} B`;
  if (bytes < 1024 ** 2) return `${formatter.format(bytes / 1024)} KB`;
  return `${formatter.format(bytes / 1024 ** 2)} MB`;
}

export function RadarPanelsClient({
  children,
  coordinates,
}: {
  children: React.ReactNode;
  coordinates: RadarPanelCoordinates[];
}): React.JSX.Element {
  const [state, action, pending] = React.useActionState<
    null | RadarPanelsActionState,
    RadarPanelCoordinates[]
  >(loadRadarOverlays, null);
  const requestedCoordinates = React.useRef<null | string>(null);

  React.useEffect(() => {
    const key = JSON.stringify(coordinates);
    if (requestedCoordinates.current === key) return;
    requestedCoordinates.current = key;
    React.startTransition(() => action(coordinates));
  }, [action, coordinates]);

  return (
    <RadarPanelsContext.Provider
      value={{ pending, results: state?.results ?? [] }}
    >
      {children}
    </RadarPanelsContext.Provider>
  );
}

export function RadarDataSummary({ id }: { id: string }): React.JSX.Element {
  const { pending, result } = useRadarPanel(id);

  if (pending || !result)
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className="size-3 animate-spin rounded-full border border-current border-r-transparent"
        />
        Loading radar data…
      </p>
    );

  if (result.error || !result.radarOverlay)
    return (
      <p className="text-xs text-muted-foreground">
        {result.error ?? "Radar data unavailable"}
      </p>
    );

  return (
    <p className="text-xs text-muted-foreground">
      Radar data fetched: {formatDataSize(result.radarOverlay.bytes)} ·{" "}
      {result.radarOverlay.downloadedStationCount} of{" "}
      {result.radarOverlay.stationCount} station files downloaded ·{" "}
      {result.radarOverlay.renderedStationCount} station layers composited
    </p>
  );
}

export function RadarSvgLayer({
  id,
}: {
  id: string;
}): null | React.JSX.Element {
  const { pending, result } = useRadarPanel(id);

  if (pending || !result)
    return (
      <g aria-label="Loading radar data" role="status">
        <circle
          className="origin-center animate-spin"
          cx={MAP_DIMENSION / 2}
          cy={MAP_DIMENSION / 2}
          fill="none"
          r="18"
          stroke="white"
          strokeDasharray="80 34"
          strokeLinecap="round"
          strokeWidth="6"
        />
      </g>
    );

  if (result.error || !result.radarOverlay) return null;

  return (
    <image
      height={MAP_DIMENSION}
      href={result.radarOverlay.dataUrl}
      preserveAspectRatio="none"
      width={MAP_DIMENSION}
    />
  );
}
