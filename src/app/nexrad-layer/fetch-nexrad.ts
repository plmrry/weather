"use server";

import type { MultiPoint } from "geojson";
import { destination } from "@turf/destination";
import * as d3 from "d3";
import Level2Radar from "nexrad-level-2-data";
import { cacheLife, cacheTag, io } from "next/cache";
import { getSatelliteProjection, MAP_SIZE } from "#/app/map-projection";
import { fetchNexradListing, fetchStationData } from "./fetch-nexrad-listing";

const EARTH_RADIUS_KILOMETERS = 6371.0088;

function reflectivityColor(value: number): string {
  if (value < 5) return "rgb(60,90,150)";
  if (value < 15) return "rgb(40,150,220)";
  if (value < 25) return "rgb(40,190,70)";
  if (value < 35) return "rgb(0,120,40)";
  if (value < 45) return "rgb(250,220,0)";
  if (value < 55) return "rgb(255,130,0)";
  if (value < 65) return "rgb(230,30,30)";
  return "rgb(220,70,220)";
}

export async function fetchNexradDataLatest(
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
) {
  // "use cache: remote";
  // cacheLife("minutes");
  // cacheTag("nexrad-data");

  // const station = await fetchStationData(params);
  // console.log("station", station);
  // const stationId = station?.stationId;
  const stationId = `KOKX`;
  const listing = await fetchNexradListing(stationId);
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

  const station = await fetchStationData(params);
  const stationId = station?.stationId;
  const listing = await fetchNexradListing(stationId);

  if (!listing?.length) return [];

  await io();

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
  // "use cache: remote";
  // cacheLife("minutes");
  // cacheTag("nexrad-data");

  const { latitude, longitude } = await params;

  const url = new URL(key, "https://unidata-nexrad-level2.s3.amazonaws.com/");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`S3 returned ${response.status}`);

  const bytes = new Uint8Array(await response.arrayBuffer());

  const data = await getRadarData(bytes);

  const parsed = parseRadarData({
    data,
    latitude: Number(latitude),
    longitude: Number(longitude),
  });
  return parsed;
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

  if (maxDistance <= 0) return { mapSize: MAP_SIZE, paths: [] };

  const distances = d3.range(minDistance, maxDistance);
  const azimuths = d3.range(0, 360);

  const visited = new Set();
  const pointsByReflectivity = new Map();

  for (const radial of Object.entries(data?.reflectivity ?? [])) {
    const radialIndex = Number(radial[0]);
    const azimuthRaw = data?.azimuths[radialIndex];
    if (!azimuthRaw) continue;
    const bearing = Math.round(azimuthRaw);
    const reflectivity = radial[1];
    const moments = reflectivity?.moment_data ?? [];
    for (const moment of Object.entries(moments)) {
      const reflectivity = moment[1];
      if (!reflectivity) continue;
      const momentIndex = Number(moment[0]);
      const distanceRaw = minDistance + momentIndex * gateSize;
      const distance = Number(distanceRaw.toPrecision(1));
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

      const points = pointsByReflectivity.get(reflectivity) ?? [];
      points.push(gateCoordinates);
      pointsByReflectivity.set(reflectivity, points);
    }
  }

  const projection = getSatelliteProjection(
    Number(latitude),
    Number(longitude),
  );

  const path = d3.geoPath(projection).digits(2).pointRadius(0.5);

  const paths = [...pointsByReflectivity.keys()].map((reflectivity) => {
    const points = pointsByReflectivity.get(reflectivity) as [number, number][];
    const multiPoint = {
      coordinates: points ?? [],
      type: "MultiPoint",
    };
    const pathData = path(multiPoint as any);
    console.log(reflectivity, pathData);
  });

  // const paths = Array.from(
  //   pointsByReflectivity,
  //   ([reflectivity, geometry]) => ({
  //     d: path(geometry) ?? "",
  //     fill: reflectivity,
  //   }),
  // );

  return { mapSize: MAP_SIZE, paths: [] };

  // const radialLookup = Array.from({ length: 3600 }, (_, angleIndex) => {
  //   const angle = angleIndex / 10;
  //   let nearest = 0;
  //   let nearestDistance = Infinity;

  //   for (let index = 0; index < (data?.azimuths.length ?? 0); index++) {
  //     const difference = Math.abs(angle - (data?.azimuths[index] ?? 0)) % 360;
  //     const distance = Math.min(difference, 360 - difference);
  //     if (distance < nearestDistance) {
  //       nearest = index;
  //       nearestDistance = distance;
  //     }
  //   }

  //   return nearest;
  // });
  // const volume = data?.radar?.getHeader(0)?.volume;
  // if (
  //   !volume ||
  //   !Number.isFinite(volume.latitude) ||
  //   !Number.isFinite(volume.longitude)
  // ) {
  //   throw new Error("Radar volume is missing station coordinates");
  // }

  // const pointsByColor = new Map<string, MultiPoint>();

  // const projection = getSatelliteProjection(
  //   Number(latitude),
  //   Number(longitude),
  // );

  // const station: [number, number] = [stationLongitude, stationLatitude];

  // for (let y = 0; y < MAP_SIZE; y++) {
  //   for (let x = 0; x < MAP_SIZE; x++) {
  //     const point = projection.invert?.([x + 0.5, y + 0.5]);
  //     if (!point || !point.every(Number.isFinite)) continue;
  //     const range = d3.geoDistance(station, point) * EARTH_RADIUS_KILOMETERS;
  //     if (range > maxDistance) continue;

  //     const pointLatitude = (point[1] * Math.PI) / 180;
  //     const longitudeDifference =
  //       ((point[0] - volume.longitude) * Math.PI) / 180;
  //     const east = Math.sin(longitudeDifference) * Math.cos(pointLatitude);
  //     const north =
  //       Math.cos(stationLatitude) * Math.sin(pointLatitude) -
  //       Math.sin(stationLatitude) *
  //         Math.cos(pointLatitude) *
  //         Math.cos(longitudeDifference);
  //     const azimuth = ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
  //     const radial = data?.reflectivity[radialLookup[Math.floor(azimuth * 10)]];
  //     if (!radial) continue;

  //     const gate = Math.floor((range - radial.first_gate) / radial.gate_size);
  //     const value = radial.moment_data[gate];
  //     if (value === null || value === undefined || !Number.isFinite(value))
  //       continue;

  //     const color = reflectivityColor(value);
  //     const geometry = pointsByColor.get(color) ?? {
  //       coordinates: [],
  //       type: "MultiPoint",
  //     };
  //     geometry.coordinates.push(point);
  //     pointsByColor.set(color, geometry);
  //   }
  // }

  // const path = d3.geoPath(projection).pointRadius(0.5);
  // const paths = Array.from(pointsByColor, ([fill, geometry]) => ({
  //   d: path(geometry) ?? "",
  //   fill,
  // }));

  // return { mapSize: MAP_SIZE, paths };
}

async function getRadarData(bytes: Uint8Array) {
  const radar = new Level2Radar(bytes);

  radar.setElevation(1);

  const reflectivity = radar.getHighresReflectivity();
  const azimuths = radar.getAzimuth();

  return { azimuths, radar, reflectivity };
}
