import { cacheLife } from "next/cache";

const RADAR_STATIONS_URL = "https://api.weather.gov/radar/stations";

export type RadarStationFeature = {
  geometry: {
    coordinates: [longitude: number, latitude: number];
    type: "Point";
  };
  properties: {
    id: string;
    name: string;
    stationType: "Profiler" | "TDWR" | "WSR-88D";
  };
  type: "Feature";
};

type RadarStationsResponse = {
  features: RadarStationFeature[];
  type: "FeatureCollection";
};

export async function getRadarStations(): Promise<RadarStationFeature[]> {
  "use cache: remote";
  cacheLife("minutes");

  const response = await fetch(RADAR_STATIONS_URL, {
    headers: { "User-Agent": "weather-app" },
  });
  if (!response.ok) throw new Error("Unable to fetch radar stations");

  const stations = (await response.json()) as RadarStationsResponse;
  return stations.features;
}
