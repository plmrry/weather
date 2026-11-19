import { cacheLife, cacheTag } from "next/cache";

export async function fetchNexradFile(key: string) {
  "use cache: remote";
  cacheLife("max");
  cacheTag("nexrad-file");

  const url = new URL(key, "https://unidata-nexrad-level2.s3.amazonaws.com/");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`S3 returned ${response.status}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes;
}
