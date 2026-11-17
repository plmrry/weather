import type Level2Radar from "nexrad-level-2-data";
import type { HighResData } from "nexrad-level-2-data";
import { destination } from "@turf/destination";
import * as d3 from "d3";
import { getSatelliteProjection, MAP_SIZE } from "#/app/map-projection";

const GRID_SIZE = 100;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const reflectivityBands = d3.range(5, 55, 5);
const reflectivityScale = d3
  .scaleQuantize<number>()
  .domain([0, 50])
  .range(reflectivityBands);
const gateCenterX = d3
  .scaleQuantize<number>()
  .domain([0, MAP_SIZE])
  .range(d3.range(GRID_SIZE));
const gateCenterY = gateCenterX.copy();

export function parseRadarData({
  data,
  latitude,
  longitude,
}: {
  data: { azimuths: number[]; radar: Level2Radar; reflectivity: HighResData[] };
  latitude: number;
  longitude: number;
}) {
  if (data.azimuths.length === 0) {
    throw new Error("Radar data contains no azimuths");
  }

  if (data.azimuths.length !== data.reflectivity.length) {
    throw new Error("Radar azimuths and reflectivity radials do not align");
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Map coordinates must be finite");
  }

  const header = data.radar.getHeader(0);
  const stationLatitude = header?.volume?.latitude;
  const stationLongitude = header?.volume?.longitude;

  if (
    stationLatitude === undefined ||
    stationLongitude === undefined ||
    !Number.isFinite(stationLatitude) ||
    !Number.isFinite(stationLongitude)
  ) {
    throw new Error("Radar volume is missing station coordinates");
  }

  const stationCoordinates: [number, number] = [
    stationLongitude,
    stationLatitude,
  ];

  const projection = getSatelliteProjection(latitude, longitude);
  const bandValues = new Float32Array(
    reflectivityBands.length * CELL_COUNT,
  ).fill(-Infinity);
  const counts = new Uint32Array(reflectivityBands.length);
  const azimuths = data.azimuths;
  const firstRadial = data.reflectivity.find(
    (radial) => radial?.moment_data?.length,
  );
  const lastGateIndex = (firstRadial?.moment_data.length ?? 1) - 1;

  const gateSize = firstRadial?.gate_size ?? 0;
  const minDistance = firstRadial?.first_gate ?? 0;
  const maxDistance = minDistance + lastGateIndex * gateSize;

  const gateDistance = d3
    .scaleLinear()
    .domain([0, lastGateIndex])
    .range(firstRadial ? [minDistance, maxDistance] : [0, 0]);

  for (const azimuthIndex of Object.keys(azimuths)) {
    const radialIndex = Number(azimuthIndex);
    const radial = data.reflectivity[radialIndex];
    const azimuth = azimuths[radialIndex];

    if (!radial || !Number.isFinite(azimuth)) continue;

    const moments = radial.moment_data;

    if (
      !moments?.length ||
      !Number.isFinite(radial.first_gate) ||
      radial.first_gate < 0 ||
      !Number.isFinite(radial.gate_size) ||
      radial.gate_size <= 0
    ) {
      continue;
    }

    for (const [gateIndex, reflectivity] of moments.entries()) {
      if (
        reflectivity === null ||
        !Number.isFinite(reflectivity) ||
        reflectivity < 0
      ) {
        continue;
      }

      const [gateLongitude, gateLatitude] = destination(
        stationCoordinates,
        gateDistance(gateIndex),
        azimuth,
        { units: "kilometers" },
      ).geometry.coordinates;

      const point = projection([gateLongitude, gateLatitude]);

      if (!point) continue;

      const [x, y] = point;

      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < 0 ||
        x >= MAP_SIZE ||
        y < 0 ||
        y >= MAP_SIZE
      ) {
        continue;
      }

      const bandIndex = reflectivityScale(reflectivity) / 5 - 1;
      const cellIndex = gateCenterY(y) * GRID_SIZE + gateCenterX(x);
      const valueIndex = bandIndex * CELL_COUNT + cellIndex;

      if (reflectivity > bandValues[valueIndex]) {
        if (bandValues[valueIndex] === -Infinity) counts[bandIndex]++;
        bandValues[valueIndex] = reflectivity;
      }
    }
  }

  const mask = new Uint8Array(CELL_COUNT);

  const generateContour = d3
    .contours()
    .size([GRID_SIZE, GRID_SIZE])
    .smooth(false).contour;

  const path = d3
    .geoPath(d3.geoIdentity().scale(MAP_SIZE / GRID_SIZE))
    .digits(1);

  const paths = reflectivityBands.map((reflectivity, bandIndex) => {
    const offset = bandIndex * CELL_COUNT;

    for (const cellIndex of mask.keys()) {
      const index = offset + cellIndex;
      const bandValue = bandValues[index];
      mask[cellIndex] = Number.isFinite(bandValue) ? 1 : 0;
    }

    const contour = generateContour(mask as any, 0.5);

    const pathData = path(contour) ?? "M0,0";

    return {
      count: counts[bandIndex],
      d: pathData,
      reflectivity,
    };
  });

  return { mapSize: MAP_SIZE, paths };
}
