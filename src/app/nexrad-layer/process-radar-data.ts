import type { HighResData } from "nexrad-level-2-data";
import { destination } from "@turf/destination";
import * as d3 from "d3";
import Level2Radar from "nexrad-level-2-data";
import {
  getSatelliteProjection,
  MAP_SIZE,
  reflectivityColorScale,
  reflectivityDomain,
  reflectivityQuantizeScale,
  reflectivityRange,
} from "#/app/map-projection";

const GRID_SIZE = 100;
const CELL_SIZE = MAP_SIZE / GRID_SIZE;

export function processRadarData(
  bytes: Uint8Array,
  mapCoordinates: [number, number],
) {
  const { azimuths, reflectivity, stationCoordinates, timestamp } =
    getRadarData(bytes);

  const layers = parseRadarData({
    azimuths,
    mapCoordinates,
    reflectivity,
    stationCoordinates,
  });

  return { layers, timestamp };
}

function getRadarData(bytes: Uint8Array) {
  const radar = new Level2Radar(new Uint8Array(bytes));
  const { milliseconds, modified_julian_date: day } = radar.header;

  if (
    typeof day !== "number" ||
    !Number.isInteger(day) ||
    day < 1 ||
    typeof milliseconds !== "number" ||
    !Number.isInteger(milliseconds) ||
    milliseconds < 0 ||
    milliseconds >= 86_401_000
  ) {
    throw new Error("Radar archive is missing a valid timestamp");
  }

  const timestamp = new Date(
    (day - 1) * 86_400_000 + milliseconds,
  ).toISOString();

  const elevations = radar.listElevations();

  radar.setElevation(elevations.at(4) ?? 1);

  const reflectivity = radar.getHighresReflectivity();
  const azimuths = radar.getAzimuth();
  const header = radar.getHeader(0);
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

  return { azimuths, reflectivity, stationCoordinates, timestamp };
}

function parseRadarData({
  azimuths,
  mapCoordinates,
  reflectivity,
  stationCoordinates,
}: {
  azimuths: number[];
  mapCoordinates: [number, number];
  reflectivity: HighResData[];
  stationCoordinates: [number, number];
}) {
  if (azimuths.length !== reflectivity.length) {
    throw new Error("Radar azimuths and reflectivity radials do not align");
  }

  if (!mapCoordinates.every(Number.isFinite)) {
    throw new Error("Map coordinates must be finite");
  }

  if (!stationCoordinates.every(Number.isFinite)) {
    throw new Error("Radar volume is missing station coordinates");
  }

  const grid = new Float64Array(GRID_SIZE * GRID_SIZE).fill(-Infinity);

  const [longitude, latitude] = mapCoordinates;
  const projection = getSatelliteProjection(latitude, longitude);

  for (const [radialIndex, azimuth] of azimuths.entries()) {
    const radial = reflectivity[radialIndex];
    if (
      !radial?.moment_data?.length ||
      !Number.isFinite(azimuth) ||
      !Number.isFinite(radial.first_gate) ||
      radial.first_gate < 0 ||
      !Number.isFinite(radial.gate_size) ||
      radial.gate_size <= 0
    ) {
      continue;
    }

    for (const [gateIndex, value] of radial.moment_data.entries()) {
      if (
        value === null ||
        !Number.isFinite(value) ||
        value < reflectivityDomain[0]
      ) {
        continue;
      }

      const gateFeature = destination(
        stationCoordinates,
        radial.first_gate + gateIndex * radial.gate_size,
        azimuth,
        { units: "kilometers" },
      );
      const [gateLongitude, gateLatitude] = gateFeature.geometry.coordinates;
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

      const gridIndex =
        Math.floor(y / CELL_SIZE) * GRID_SIZE + Math.floor(x / CELL_SIZE);
      const quantizedReflectivity = reflectivityQuantizeScale(value);
      grid[gridIndex] = Math.max(grid[gridIndex], quantizedReflectivity);
    }
  }

  const contourProjection = d3.geoIdentity().scale(CELL_SIZE);
  const contourGenerator = d3.contours().size([GRID_SIZE, GRID_SIZE]);
  const contourPathGenerator = d3.geoPath(contourProjection);
  const mask = new Uint8Array(grid.length);

  return reflectivityRange.map((reflectivity) => {
    let count = 0;
    for (const [index, value] of grid.entries()) {
      if (value === reflectivity) count += 1;
      mask[index] = value >= reflectivity ? 1 : 0;
    }

    const contour = contourGenerator.contour(mask as any, 0.5);
    const contourPath = contourPathGenerator(contour) ?? "";

    return {
      contourPath,
      count,
      fill: reflectivityColorScale(reflectivity),
      reflectivity,
    };
  });
}
