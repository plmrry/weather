"use server";

import { cacheLife, cacheTag, io } from "next/cache";
import { fetchStationData } from "#/app/fetch-station-data";
import { fetchNexradFile } from "./fetch-nexrad-file";
import { fetchNexradList } from "./fetch-nexrad-list";
import { processRadarData } from "./process-radar-data";

export async function fetchNexradData({
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

async function fetchAndParseNexradData(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
  key: string,
) {
  const { latitude, longitude } = await params;

  const bytes = await fetchNexradFile(key);

  const parsed = processRadarData(bytes, [Number(longitude), Number(latitude)]);

  return { ...parsed, key };
}
