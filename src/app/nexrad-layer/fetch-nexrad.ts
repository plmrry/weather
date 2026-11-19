"use server";

import Level2Radar from "nexrad-level-2-data";
import { io } from "next/cache";
import { fetchStationData } from "#/app/fetch-station-data";
import { reflectivityColorScale } from "#/app/map-projection";
import { fetchNexradFile } from "./fetch-nexrad-file";
import { fetchNexradList } from "./fetch-nexrad-list";
import { parseRadarData } from "./parse-radar-data";

export async function fetchNexradDataLatest(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
) {
  // "use cache: remote";
  // cacheLife("minutes");
  // cacheTag("nexrad-data");

  await io();

  const station = await fetchStationData(params);
  const stationId = station?.stationId;
  const listing = await fetchNexradList(stationId);
  const key = listing?.at(-1);

  if (!key) return null;

  return fetchAndParseNexradData(params, key);
}
export type fetchNexradDataLatest = typeof fetchNexradDataLatest;

export async function fetchNexradDataOneHour(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
) {
  // "use cache: remote";
  // cacheLife("minutes");
  // cacheTag("nexrad-data");

  await io();

  const station = await fetchStationData(params);
  const stationId = station?.stationId;
  const listing = await fetchNexradList(stationId);

  if (!listing?.length) return [];

  const now = Date.now();
  const startTime = now - 60 * 60 * 1000;
  const keys: string[] = [];

  for (const candidate of listing) {
    const timestamp = candidate.match(
      /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})_(?<hour>\d{2})(?<minute>\d{2})(?<second>\d{2})/,
    );
    if (!timestamp?.groups) continue;

    const { day, hour, minute, month, second, year } = timestamp.groups;
    const scanTime = Date.parse(
      `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
    );
    if (scanTime >= startTime && scanTime <= now) {
      keys.push(candidate);
    }
  }

  const results = await Promise.allSettled(
    keys.map((key) => fetchAndParseNexradData(params, key)),
  );

  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}
export type fetchNexradDataOneHour = typeof fetchNexradDataOneHour;

async function fetchAndParseNexradData(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
  key: string,
) {
  const { latitude, longitude } = await params;

  const bytes = await fetchNexradFile(key);

  const { azimuths, reflectivity, stationCoordinates } =
    await getRadarData(bytes);

  const parsed = parseRadarData({
    azimuths,
    mapCoordinates: [Number(longitude), Number(latitude)],
    reflectivity,
    stationCoordinates,
  });

  const paths = parsed.paths.map((path) => ({
    ...path,
    fill: reflectivityColorScale(path.reflectivity),
  }));

  return { ...parsed, key, paths };
}

async function getRadarData(bytes: Uint8Array) {
  const radar = new Level2Radar(new Uint8Array(bytes));

  radar.setElevation(1);

  const reflectivity = radar.getHighresReflectivity();
  const azimuths = radar.getAzimuth();
  const header = radar.getHeader(0);
  const stationLatitude = header?.volume?.latitude;
  const stationLongitude = header?.volume?.longitude;

  if (
    stationLatitude === undefined ||
    stationLongitude === undefined ||
    !Number.isFinite(stationLatitude) ||
    !Number.isFinite(stationLongitude)
  ) {
    throw new Error("Radar volume is missing station coordinates");
  }

  const stationCoordinates: [number, number] = [
    stationLongitude,
    stationLatitude,
  ];

  return { azimuths, reflectivity, stationCoordinates };
}
