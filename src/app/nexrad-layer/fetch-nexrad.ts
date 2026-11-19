"use server";

import { cacheLife, cacheTag, io } from "next/cache";
import { fetchStationData } from "#/app/fetch-station-data";
import { fetchNexradFile } from "./fetch-nexrad-file";
import { fetchNexradList } from "./fetch-nexrad-list";
import { processRadarData } from "./process-radar-data";

export async function fetchNexradData({
  offsetMinutes,
  params,
}: {
  offsetMinutes: number;
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  return fetchNexradDataCached({ offsetMinutes, params: await params });
}

async function fetchNexradDataCached({
  offsetMinutes,
  params,
}: {
  offsetMinutes: number;
  params: Awaited<
    PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"]
  >;
}) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-data");

  await io();

  const station = await fetchStationData(Promise.resolve(params));
  const stationId = station?.stationId;
  const listing = await fetchNexradList(stationId);
  const files = (listing ?? []).map((key) => ({
    key,
    timestamp: getNexradFileTimestamp(key),
  }));
  const latest = files.at(-1);

  if (!latest) return null;

  const targetTimestamp = latest.timestamp - offsetMinutes * 60_000;
  const nearest = files.reduce(
    (nearest, file) =>
      Math.abs(file.timestamp - targetTimestamp) <
      Math.abs(nearest.timestamp - targetTimestamp)
        ? file
        : nearest,
    latest,
  );

  return fetchAndParseNexradData(params, nearest.key);
}
export type fetchNexradData = typeof fetchNexradData;

function getNexradFileTimestamp(key: string) {
  const match = key.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!match)
    throw new Error(`Radar archive is missing a valid timestamp: ${key}`);

  const [, year, month, day, hour, minute, second] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
}

async function fetchAndParseNexradData(
  params: Awaited<
    PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"]
  >,
  key: string,
) {
  const { latitude, longitude } = params;

  const bytes = await fetchNexradFile(key);

  const parsed = processRadarData(bytes, [Number(longitude), Number(latitude)]);

  return { ...parsed, key };
}
