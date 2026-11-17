"use server";

export async function fetchNexradListing(): Promise<string> {
  const url = new URL("https://unidata-nexrad-level2.s3.amazonaws.com/");
  url.search = new URLSearchParams({
    "list-type": "2",
    prefix: "2026/11/16/KTLX/",
  }).toString();

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`S3 returned ${response.status}`);

  return response.text();
}
