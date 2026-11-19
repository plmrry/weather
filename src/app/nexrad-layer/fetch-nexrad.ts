"use server";

import { cacheLife, cacheTag, io } from "next/cache";
import { fetchStationData } from "#/app/fetch-station-data";
import { fetchNexradFile } from "./fetch-nexrad-file";
import { fetchNexradList } from "./fetch-nexrad-list";
import { processRadarData } from "./process-radar-data";

export async function fetchNexradDataLatest(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-data");

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
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-data");

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

  const parsed = await processRadarData(bytes, [
    Number(longitude),
    Number(latitude),
  ]);

  return { ...parsed, key };
}
