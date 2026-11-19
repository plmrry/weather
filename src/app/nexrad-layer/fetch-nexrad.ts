"use server";

import { cacheLife, cacheTag, io } from "next/cache";
import { fetchStationData } from "#/app/fetch-station-data";
import { fetchNexradFile } from "./fetch-nexrad-file";
import { fetchNexradList } from "./fetch-nexrad-list";
import { processRadarData } from "./process-radar-data";

async function fetchNexradData({
  offset,
  params,
}: {
  offset: number;
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-data");

  await io();

  const station = await fetchStationData(params);
  const stationId = station?.stationId;
  const listing = await fetchNexradList(stationId);
  const key = listing?.at(-offset);

  if (!key) return null;

  return fetchAndParseNexradData(params, key);
}
export type fetchNexradData = typeof fetchNexradData;

export async function fetchNexradDataLatest(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-data");

  await io();

  return fetchNexradData({ offset: 1, params });
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

  const now = Date.now();
  const startTime = now - 60 * 60 * 1000;
  const keys: string[] = [];

  for (const candidate of listing ?? []) {
    const scanTime = Date.parse(getNexradTimestamp(candidate));
    if (scanTime >= startTime && scanTime <= now) {
      keys.push(candidate);
    }
  }

  const results = await Promise.allSettled(
    keys.map((key) => fetchAndParseNexradData(params, key)),
  );

  const frames = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  const keyTimes = frames.length
    ? Array.from({ length: frames.length + 1 }, (_, index) =>
        (index / frames.length).toFixed(1),
      ).join(";")
    : "";

  return {
    frames: frames.map((frame, frameIndex) => ({
      ...frame,
      animateValues: [
        ...frames.map((_, index) =>
          index === frameIndex ? "visible" : "hidden",
        ),
        frameIndex === 0 ? "visible" : "hidden",
      ].join(";"),
    })),
    keyTimes,
  };
}
export type fetchNexradDataOneHour = typeof fetchNexradDataOneHour;

async function fetchAndParseNexradData(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
  key: string,
) {
  const { latitude, longitude } = await params;

  const bytes = await fetchNexradFile(key);

  const parsed = processRadarData(bytes, [Number(longitude), Number(latitude)]);

  return { ...parsed, key };
}

function getNexradTimestamp(key: string): string {
  const match = key.match(
    /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})_(?<hour>\d{2})(?<minute>\d{2})(?<second>\d{2})/,
  );
  if (!match?.groups)
    throw new Error(`NEXRAD filename is missing a timestamp: ${key}`);
  const { day, hour, minute, month, second, year } = match.groups;
  return new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}Z`,
  ).toISOString();
}
