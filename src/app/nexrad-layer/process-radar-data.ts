import type { FeatureCollection, Point } from "geojson";
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

  const gridPoints = d3.range(GRID_SIZE);

  const gridX = d3
    .scaleQuantize<number>()
    .domain([0, MAP_SIZE])
    .range(gridPoints);

  const gridY = gridX.copy();

  const grid: FeatureCollection<Point, { reflectivity: null | number }> = {
    features: [],
    type: "FeatureCollection",
  };

  for (const x of gridPoints) {
    for (const y of gridPoints) {
      grid.features.push({
        geometry: {
          coordinates: [(x + 0.5) * CELL_SIZE, (y + 0.5) * CELL_SIZE],
          type: "Point",
        },
        properties: {
          reflectivity: null,
        },
        type: "Feature",
      });
    }
  }

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

      const cellIndex = gridX(x) * GRID_SIZE + gridY(y);

      const feature = grid.features[cellIndex];

      const quantizedReflectivity = reflectivityQuantizeScale(value);

      const newMaximum = Math.max(
        feature?.properties?.reflectivity ?? -Infinity,
        quantizedReflectivity,
      );

      feature.properties.reflectivity = newMaximum;
    }
  }

  const contourProjection = d3.geoIdentity().scale(CELL_SIZE);
  const contourGenerator = d3.contours().size([GRID_SIZE, GRID_SIZE]);
  const path = d3.geoPath(contourProjection);

  return reflectivityRange.map((reflectivity) => {
    const matchingFeatures = grid.features.filter(
      (cell) => cell.properties.reflectivity === reflectivity,
    );
    const contourFeatures = grid.features.filter(
      ({ properties }) =>
        properties.reflectivity !== null &&
        properties.reflectivity >= reflectivity,
    );
    const mask = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => 0);
    for (const cell of contourFeatures) {
      const [x, y] = cell.geometry.coordinates;
      const gridIndex = gridY(y) * GRID_SIZE + gridX(x);
      mask[gridIndex] = 1;
    }

    const contour = contourGenerator.contour(mask, 0.5);
    const contourPath = path(contour) ?? "";

    return {
      contourPath,
      count: matchingFeatures.length,
      fill: reflectivityColorScale(reflectivity),
      reflectivity,
    };
  });
}
