"use server";

import type { RadarOverlay } from "./radar-data";
import { getCachedRadarOverlay } from "./radar-cache";
import { truncateRadarCoordinate } from "./radar-location";

export type RadarPanelCoordinates = {
  id: string;
  latitude: number;
  longitude: number;
};

export type RadarPanelOverlay = {
  imageUrl: string;
} & Omit<RadarOverlay, "dataUrl">;

export type RadarPanelResult = {
  error: null | string;
  id: string;
  radarOverlay: null | RadarPanelOverlay;
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
        const latitudeKey = truncateRadarCoordinate(latitude);
        const longitudeKey = truncateRadarCoordinate(longitude);
        const radarOverlay = await getCachedRadarOverlay(
          latitudeKey,
          longitudeKey,
        );
        return radarOverlay
          ? {
              error: null,
              id,
              radarOverlay: {
                bytes: radarOverlay.bytes,
                downloadedStationCount: radarOverlay.downloadedStationCount,
                imageUrl: `/api/radar-overlay?latitude=${latitudeKey}&longitude=${longitudeKey}`,
                renderedStationCount: radarOverlay.renderedStationCount,
                stationCount: radarOverlay.stationCount,
              },
            }
          : { error: "No radar station data available", id, radarOverlay };
      } catch {
        return { error: "Unable to load radar data", id, radarOverlay: null };
      }
    }),
  );

  return { results };
}
