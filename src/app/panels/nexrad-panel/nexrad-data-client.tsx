"use client";

import React from "react";
import type { fetchNexradData } from "./fetch-nexrad";

const GRID_SIZE = 512;

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

export function NexradDataClient({
  data,
}: {
  data: ReturnType<typeof fetchNexradData>;
}): React.JSX.Element {
  const { azimuths, reflectivity } = React.use(data);
  const paths = React.useMemo(() => {
    if (azimuths.length === 0) return [];

    const maxRange = Math.max(
      ...reflectivity.map((radial) =>
        radial ? radial.first_gate + radial.gate_count * radial.gate_size : 0,
      ),
    );
    if (maxRange <= 0) return [];

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
    const pathsByColor = new Map<string, string[]>();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const east = (((x + 0.5) / GRID_SIZE) * 2 - 1) * maxRange;
        const north = (1 - ((y + 0.5) / GRID_SIZE) * 2) * maxRange;
        const range = Math.hypot(east, north);
        if (range > maxRange) continue;

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

    return Array.from(pathsByColor, ([fill, segments]) => ({
      d: segments.join(""),
      fill,
    }));
  }, [azimuths, reflectivity]);

  return (
    <svg
      className="absolute inset-0 size-full"
      role="img"
      shapeRendering="crispEdges"
      viewBox={` 0 0 ${GRID_SIZE} ${GRID_SIZE}`}
    >
      <title>
        NEXRAD reflectivity with north at the top and the radar at the center.
      </title>
      {paths.map(({ d, fill }) => (
        <path d={d} fill={fill} key={fill} />
      ))}
    </svg>
  );
}
