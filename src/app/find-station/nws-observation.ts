import { cacheLife } from "next/cache";

const USER_AGENT = "(weather-cafe.vercel.app, contact@weather-cafe.example)";

type StationObservation = {
  stationId: string;
  stationName: string;
  timestamp: string;
};

async function fetchJson<T>(url: string): Promise<null | T> {
  const response = await fetch(url, {
    headers: { Accept: "application/geo+json", "User-Agent": USER_AGENT },
  });

  if (!response.ok) return null;

  return (await response.json()) as T;
}

export async function getStationObservation(
  latitude: number,
  longitude: number,
): Promise<null | StationObservation> {
  "use cache";
  cacheLife("minutes");

  const points = await fetchJson<{
    properties?: { observationStations?: string };
  }>(`https://api.weather.gov/points/${latitude},${longitude}`);

  const stationsUrl = points?.properties?.observationStations;
  if (!stationsUrl) return null;

  const stations = await fetchJson<{
    features?: { properties?: { name?: string; stationIdentifier?: string } }[];
  }>(stationsUrl);

  const station = stations?.features?.[0]?.properties;
  const stationId = station?.stationIdentifier;
  if (!stationId) return null;

  const latest = await fetchJson<{
    properties?: { timestamp?: string };
  }>(`https://api.weather.gov/stations/${stationId}/observations/latest`);

  const timestamp = latest?.properties?.timestamp;
  if (!timestamp) return null;

  return { stationId, stationName: station?.name ?? stationId, timestamp };
}
