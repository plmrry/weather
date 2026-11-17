import { cacheLife } from "next/cache";

const USER_AGENT = "(weather-cafe.vercel.app, paul@paulmurray.lol)";

async function fetchJson<T>(url: string): Promise<null | T> {
  const response = await fetch(url, {
    headers: { Accept: "application/geo+json", "User-Agent": USER_AGENT },
  });

  if (!response.ok) return null;

  return (await response.json()) as T;
}

export async function getStationData({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  "use cache";
  cacheLife("minutes");

  const gridData = await fetchJson<{
    properties?: { observationStations?: string; radarStation?: string };
  }>(
    `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
  );

  const stationsUrl = gridData?.properties?.observationStations;
  if (!stationsUrl) return null;

  const stations = await fetchJson<{
    features?: { properties?: { name?: string; stationIdentifier?: string } }[];
  }>(stationsUrl);

  const station = stations?.features?.[0]?.properties;
  const stationId = station?.stationIdentifier;
  if (!stationId) return null;

  const latestObservation = await fetchJson<{
    properties?: { timestamp?: string };
  }>(`https://api.weather.gov/stations/${stationId}/observations/latest`);

  const timestamp = latestObservation?.properties?.timestamp;
  if (!timestamp) return null;

  return {
    gridData,
    latestObservation,
    stationId,
    stationName: station?.name ?? stationId,
    stations,
    timestamp,
  };
}
