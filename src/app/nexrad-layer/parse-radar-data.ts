import type { FeatureCollection, Point } from "geojson";
import type { HighResData } from "nexrad-level-2-data";
import { destination } from "@turf/destination";
import * as d3 from "d3";
import {
  getSatelliteProjection,
  MAP_SIZE,
  reflectivityColorScale,
  reflectivityQuantizeScale,
  reflectivityRange,
} from "#/app/map-projection";

const GRID_SIZE = 100;
const CELL_SIZE = MAP_SIZE / GRID_SIZE;
const collator = new Intl.Collator("en", { numeric: true });

export function parseRadarData({
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

  const indices = d3.range(GRID_SIZE);
  const grid: FeatureCollection<
    Point,
    { fill: null | string; reflectivity: null | number }
  > = {
    features: [],
    type: "FeatureCollection",
  };

  for (const x of indices) {
    for (const y of indices) {
      grid.features.push({
        geometry: {
          coordinates: [(x + 0.5) * CELL_SIZE, (y + 0.5) * CELL_SIZE],
          type: "Point",
        },
        properties: {
          fill: null,
          reflectivity: null,
        },
        type: "Feature",
      });
    }
  }

  const [longitude, latitude] = mapCoordinates;
  const projection = getSatelliteProjection(latitude, longitude);
  const gridX = d3.scaleQuantize<number>().domain([0, MAP_SIZE]).range(indices);
  const gridY = gridX.copy();

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
      if (value === null || !Number.isFinite(value)) continue;

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

      const alignedReflectivity = reflectivityQuantizeScale(value);

      const cellIndex = gridX(x) * GRID_SIZE + gridY(y);

      const cell = grid.features[cellIndex];

      const newMaximum = Math.max(
        cell?.properties?.reflectivity ?? -Infinity,
        alignedReflectivity,
      );

      cell.properties.reflectivity = newMaximum;
      cell.properties.fill = reflectivityColorScale(newMaximum);
    }
  }

  const contourProjection = d3.geoIdentity().scale(CELL_SIZE);
  const contourGenerator = d3.contours().size([GRID_SIZE, GRID_SIZE]);
  const path = d3.geoPath().pointRadius(CELL_SIZE / 6);

  const layers = reflectivityRange
    .map((reflectivity) => {
      const matchingFeatures = grid.features.filter(
        (cell) => cell.properties.reflectivity === reflectivity,
      );
      const matchingCells: FeatureCollection<Point> = {
        features: matchingFeatures,
        type: "FeatureCollection",
      };
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
      const gridPath = path.projection(null)(matchingCells) ?? "";
      const contourPath = path.projection(contourProjection)(contour) ?? "";

      return {
        contourPath,
        count: matchingCells.features.length,
        gridPath,
        reflectivity,
      };
    })
    .toSorted((a, b) =>
      collator.compare(String(a.reflectivity), String(b.reflectivity)),
    );

  return { grid, layers };
}
