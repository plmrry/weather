"use server";

import type { RadarOverlay } from "./radar-data";
import { getCachedRadarOverlay } from "./radar-cache";
import { truncateRadarCoordinate } from "./radar-location";

export type RadarPanelCoordinates = {
  id: string;
  latitude: number;
  longitude: number;
};

export type RadarPanelResult = {
  error: null | string;
  id: string;
  radarOverlay: null | RadarOverlay;
};

export type RadarPanelsActionState = {
  results: RadarPanelResult[];
};

export async function loadRadarOverlays(
  _previousState: null | RadarPanelsActionState,
  coordinates: RadarPanelCoordinates[],
): Promise<RadarPanelsActionState> {
  const results: RadarPanelResult[] = await Promise.all(
    coordinates.map(async ({ id, latitude, longitude }) => {
      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      )
        return { error: "Invalid map coordinates", id, radarOverlay: null };

      try {
        const radarOverlay = await getCachedRadarOverlay(
          truncateRadarCoordinate(latitude),
          truncateRadarCoordinate(longitude),
        );
        return radarOverlay
          ? { error: null, id, radarOverlay }
          : { error: "No radar station data available", id, radarOverlay };
      } catch {
        return { error: "Unable to load radar data", id, radarOverlay: null };
      }
    }),
  );

  return { results };
}
