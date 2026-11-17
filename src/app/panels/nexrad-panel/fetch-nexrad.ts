"use server";

import { geoDistance } from "d3-geo";
import { getSatelliteProjection, MAP_SIZE } from "#/app/map-projection";
import { fetchNexradListing } from "./fetch-nexrad-listing";

const EARTH_RADIUS_KILOMETERS = 6371.0088;

function reflectivityColor(value: number): [number, number, number] {
  if (value < 5) return [60, 90, 150];
  if (value < 15) return [40, 150, 220];
  if (value < 25) return [40, 190, 70];
  if (value < 35) return [0, 120, 40];
  if (value < 45) return [250, 220, 0];
  if (value < 55) return [255, 130, 0];
  if (value < 65) return [230, 30, 30];
  return [220, 70, 220];
}

export async function fetchNexradData(
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
): Promise<{
  mapSize: number;
  paths: { d: string; fill: string }[];
} | null> {
  if (!params) return null;

  const { latitude, longitude } = await params;
  const projection = getSatelliteProjection(
    Number(latitude),
    Number(longitude),
  );
  const listing = await fetchNexradListing(params);
  const key = listing?.at(-1);
  if (!key) return null;
  const url = new URL(key, "https://unidata-nexrad-level2.s3.amazonaws.com/");
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`S3 returned ${response.status}`);

  const bytes = new Uint8Array(await response.arrayBuffer());
  const { default: Level2Radar } = await import("nexrad-level-2-data");
  const radar = new Level2Radar(bytes);

  radar.setElevation(1);

  const reflectivity = radar.getHighresReflectivity();
  const azimuths = radar.getAzimuth();

  if (azimuths.length === 0) return { mapSize: MAP_SIZE, paths: [] };

  const maxRange = Math.max(
    ...reflectivity.map((radial) =>
      radial ? radial.first_gate + radial.gate_count * radial.gate_size : 0,
    ),
  );
  if (maxRange <= 0) return { mapSize: MAP_SIZE, paths: [] };

  const radialLookup = Array.from({ length: 3600 }, (_, angleIndex) => {
    const angle = angleIndex / 10;
    let nearest = 0;
    let nearestDistance = Infinity;

    for (let index = 0; index < azimuths.length; index++) {
      const difference = Math.abs(angle - azimuths[index]) % 360;
      const distance = Math.min(difference, 360 - difference);
      if (distance < nearestDistance) {
        nearest = index;
        nearestDistance = distance;
      }
    }

    return nearest;
  });
  const { volume } = radar.getHeader(0);
  if (
    !volume ||
    !Number.isFinite(volume.latitude) ||
    !Number.isFinite(volume.longitude)
  ) {
    throw new Error("Radar volume is missing station coordinates");
  }
  const station: [number, number] = [volume.longitude, volume.latitude];
  const stationLatitude = (volume.latitude * Math.PI) / 180;
  const pathsByColor = new Map<string, string[]>();

  for (let y = 0; y < MAP_SIZE; y++) {
    for (let x = 0; x < MAP_SIZE; x++) {
      const point = projection.invert?.([x + 0.5, y + 0.5]);
      if (!point || !point.every(Number.isFinite)) continue;
      const range = geoDistance(station, point) * EARTH_RADIUS_KILOMETERS;
      if (range > maxRange) continue;

      const pointLatitude = (point[1] * Math.PI) / 180;
      const longitudeDifference =
        ((point[0] - volume.longitude) * Math.PI) / 180;
      const east = Math.sin(longitudeDifference) * Math.cos(pointLatitude);
      const north =
        Math.cos(stationLatitude) * Math.sin(pointLatitude) -
        Math.sin(stationLatitude) *
          Math.cos(pointLatitude) *
          Math.cos(longitudeDifference);
      const azimuth = ((Math.atan2(east, north) * 180) / Math.PI + 360) % 360;
      const radial = reflectivity[radialLookup[Math.floor(azimuth * 10)]];
      if (!radial) continue;

      const gate = Math.floor((range - radial.first_gate) / radial.gate_size);
      const value = radial.moment_data[gate];
      if (value === null || value === undefined || !Number.isFinite(value))
        continue;

      const color = `rgb(${reflectivityColor(value).join(",")})`;
      const segments = pathsByColor.get(color) ?? [];
      segments.push(`M${x},${y}h1v1h-1z`);
      pathsByColor.set(color, segments);
    }
  }

  const paths = Array.from(pathsByColor, ([fill, segments]) => ({
    d: segments.join(""),
    fill,
  }));

  return { mapSize: MAP_SIZE, paths };
}
