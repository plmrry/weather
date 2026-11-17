"use server";

import { XMLParser } from "fast-xml-parser";
import { io } from "next/cache";
import { getStationData } from "#/app/get-station-data";

export async function fetchNexradListing(
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
): Promise<null | string[]> {
  if (!params) return null;

  const { latitude, longitude } = await params;
  const station = await getStationData({
    latitude: Number(latitude),
    longitude: Number(longitude),
  });
  const stationId = station?.gridData?.properties?.radarStation;
  if (!stationId) return null;

  await io();

  const datePrefix = new Date().toISOString().slice(0, 10).replaceAll("-", "/");
  const url = new URL("https://unidata-nexrad-level2.s3.amazonaws.com/");
  url.search = new URLSearchParams({
    "list-type": "2",
    prefix: `${datePrefix}/${stationId}/`,
  }).toString();

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`S3 returned ${response.status}`);

  const xml = await response.text();
  const parser = new XMLParser({
    isArray: (name) => name === "Contents",
    parseTagValue: false,
  });
  const result: {
    ListBucketResult: { Contents?: { Key: string }[] };
  } = parser.parse(xml);

  return (result.ListBucketResult.Contents ?? [])
    .map((entry) => entry.Key)
    .filter((key) => !key.endsWith("_MDM"));
}
