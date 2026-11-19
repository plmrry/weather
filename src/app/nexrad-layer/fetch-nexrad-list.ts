"use server";

import { XMLParser } from "fast-xml-parser";
import { cacheLife, cacheTag, io } from "next/cache";

export async function fetchNexradList(
  stationId?: string,
): Promise<null | string[]> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-list");

  await io();

  const datePrefix = new Date().toISOString().slice(0, 10).replaceAll("-", "/");
  const url = new URL("https://unidata-nexrad-level2.s3.amazonaws.com/");
  url.search = new URLSearchParams({
    delimiter: "/",
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
