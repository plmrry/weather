import * as d3 from "d3";
import { cacheLife, cacheTag } from "next/cache";

const USER_AGENT = "(weather-cafe.vercel.app, paul@paulmurray.lol)";

async function fetchJson<T>(url: string): Promise<null | T> {
  const response = await fetch(url, {
    headers: { Accept: "application/geo+json", "User-Agent": USER_AGENT },
  });

  if (!response.ok) return null;

  return (await response.json()) as T;
}

type RadarStation = {
  geometry: { coordinates: [number, number]; type: "Point" };
  properties: {
    id: string;
    latency?: { levelTwoLastReceivedTime?: string };
    name: string;
    stationType: string;
  };
};

async function getRadarStations() {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("station-data");

  return fetchJson<{ features: RadarStation[] }>(
    "https://api.weather.gov/radar/stations?stationType=WSR-88D",
  );
}

export async function getStationData({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("station-data");

  const stations = await getRadarStations();

  const station = d3.least(
    stations?.features.filter(
      (station) =>
        station.properties.stationType === "WSR-88D" &&
        station.geometry?.type === "Point" &&
        station.geometry.coordinates.every(Number.isFinite),
    ) ?? [],
    (station) =>
      d3.geoDistance([longitude, latitude], station.geometry.coordinates),
  );
  if (!station) return null;

  return {
    stationCoordinates: station.geometry?.coordinates,
    stationId: station.properties.id,
    stationName: station.properties.name,
    timestamp: station.properties.latency?.levelTwoLastReceivedTime,
  };
}
