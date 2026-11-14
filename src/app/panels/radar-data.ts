import { cacheLife } from "next/cache";

const RADAR_STATIONS_URL = "https://api.weather.gov/radar/stations";
const RIDGEII_URL = "https://mrms.ncep.noaa.gov/RIDGEII/L3";

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

export type RadarOverlay = {
  bytes: number;
  dataUrl: string;
  downloadedStationCount: number;
  renderedStationCount: number;
  stationCount: number;
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

export async function getLatestRadarFileUrl(
  stationId: string,
  product: string,
): Promise<null | string> {
  "use cache: remote";
  cacheLife("minutes");

  const productUrl = `${RIDGEII_URL}/${stationId}/${product}/`;
  const response = await fetch(productUrl);
  if (response.status === 429 || response.status >= 500)
    throw new Error(`Unable to fetch radar directory: ${response.status}`);
  if (!response.ok) return null;

  const html = await response.text();
  const filenames = [...html.matchAll(/href="([^"]+\.tif\.gz)"/g)]
    .map((match) => match[1])
    .sort();
  const filename = filenames.at(-1);
  return filename ? `${productUrl}${filename}` : null;
}

export async function getRadarFile(
  fileUrl: string,
): Promise<null | Uint8Array> {
  "use cache: remote";
  cacheLife("minutes");

  const response = await fetch(fileUrl);
  if (response.status === 429 || response.status >= 500)
    throw new Error(`Unable to fetch radar file: ${response.status}`);
  if (!response.ok) return null;

  return new Uint8Array(await response.arrayBuffer());
}
