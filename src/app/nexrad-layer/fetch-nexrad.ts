"use server";

import { destination } from "@turf/destination";
import * as d3 from "d3";
import Level2Radar from "nexrad-level-2-data";
import { cacheLife, cacheTag, io } from "next/cache";
import {
  getSatelliteProjection,
  MAP_SIZE,
  reflectivityDomain,
  reflectivityQuantizeScale,
} from "#/app/map-projection";
import { fetchNexradListing, fetchStationData } from "./fetch-nexrad-listing";

export async function fetchNexradDataLatest(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
) {
  // "use cache: remote";
  // cacheLife("minutes");
  // cacheTag("nexrad-data");

  const station = await fetchStationData(params);
  const stationId = station?.stationId;
  const listing = await fetchNexradListing(stationId);
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

  const station = await fetchStationData(params);
  const stationId = station?.stationId;
  const listing = await fetchNexradListing(stationId);

  if (!listing?.length) return [];

  // await io();

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

  const bytes = await fetchNexradData(key);

  const data = await getRadarData(bytes);

  const parsed = parseRadarData({
    data,
    latitude: Number(latitude),
    longitude: Number(longitude),
  });

  return { ...parsed, key };
}

async function fetchNexradData(key: string) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-data");

  const url = new URL(key, "https://unidata-nexrad-level2.s3.amazonaws.com/");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`S3 returned ${response.status}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes;
}

function parseRadarData({
  data,
  latitude,
  longitude,
}: {
  data: Awaited<ReturnType<typeof getRadarData>>;
  latitude: number;
  longitude: number;
}) {
  if (data?.azimuths.length === 0) {
    throw new Error("Radar data contains no azimuths");
  }

  const header = data?.radar?.getHeader(0);
  const stationLatitude = header?.volume?.latitude;
  const stationLongitude = header?.volume?.longitude;

  if (!stationLatitude || !stationLongitude) {
    throw new Error("Radar volume is missing station coordinates");
  }

  const stationCoordinates: [number, number] = [
    stationLongitude,
    stationLatitude,
  ];

  const first = data?.reflectivity[0];

  const gateCount = first?.gate_count ?? 0;
  const gateSize = first?.gate_size ?? 0;
  const minDistance = first?.first_gate ?? 0;
  const maxDistance = minDistance + gateCount * gateSize;

  if (maxDistance <= 0) {
    throw new Error("Radar data contains no valid gates");
  }

  const distanceQuantizeScale = d3
    .scaleQuantize<string>()
    .domain([minDistance, maxDistance])
    .range(d3.range(minDistance, maxDistance).map(String));

  const visited = new Set();
  const pointsByReflectivity = new Map();

  for (const radial of Object.entries(data?.reflectivity ?? [])) {
    const radialIndex = Number(radial[0]);
    const azimuthRaw = data?.azimuths[radialIndex];
    if (!azimuthRaw) continue;
    const bearing = Math.round(azimuthRaw);
    const reflectivityData = radial[1];
    const moments = reflectivityData?.moment_data ?? [];
    for (const moment of Object.entries(moments)) {
      const reflectivityRaw = moment[1];
      if (!reflectivityRaw) continue;
      if (reflectivityRaw < reflectivityDomain[0]) continue;

      const momentIndex = Number(moment[0]);

      const distanceRaw = minDistance + momentIndex * gateSize;

      const distance = Number(distanceQuantizeScale(distanceRaw));

      const key = `${bearing}-${distance}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const gateCoordinates = destination(
        {
          coordinates: stationCoordinates,
          type: "Point",
        },
        distance,
        bearing,
        { units: "kilometers" },
      ).geometry.coordinates;

      const reflectivity = Number(reflectivityQuantizeScale(reflectivityRaw));

      const points = pointsByReflectivity.get(reflectivity) ?? [];
      points.push(gateCoordinates);
      pointsByReflectivity.set(reflectivity, points);
    }
  }

  const projection = getSatelliteProjection(
    Number(latitude),
    Number(longitude),
  );

  const path = d3.geoPath(projection).digits(0).pointRadius(0.5);

  const collator = new Intl.Collator(undefined, { numeric: true });
  const reflectivities = [...pointsByReflectivity.keys()].toSorted((a, b) =>
    collator.compare(String(a), String(b)),
  );

  const paths = reflectivities.map((reflectivity) => {
    const points = pointsByReflectivity.get(reflectivity) as [number, number][];
    const sorted = points
      ?.toSorted((a, b) => collator.compare(String(a[0]), String(b[0])))
      .toSorted((a, b) => collator.compare(String(a[1]), String(b[1])));
    const multiPoint = {
      coordinates: sorted ?? [],
      type: "MultiPoint",
    };
    const pathData = path(multiPoint as any);
    return { count: points.length, d: pathData, reflectivity };
  });

  return { mapSize: MAP_SIZE, paths };
}

async function getRadarData(bytes: Uint8Array) {
  const radar = new Level2Radar(bytes);

  radar.setElevation(1);

  const reflectivity = radar.getHighresReflectivity();
  const azimuths = radar.getAzimuth();

  return { azimuths, radar, reflectivity };
}
