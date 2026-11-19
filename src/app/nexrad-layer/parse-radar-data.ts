import type { MultiPoint, Point } from "geojson";
import type { HighResData } from "nexrad-level-2-data";
import * as d3 from "d3";
import { MAP_SIZE } from "#/app/map-projection";

const GRID_SIZE = 100;
const CELL_SIZE = MAP_SIZE / GRID_SIZE;
const reflectivityBands = d3.range(5, 55, 5);
const radiusScale = d3
  .scaleLinear()
  .domain([5, 50])
  .range([MAP_SIZE / 2, MAP_SIZE / 20]);

export function parseRadarData(_params: {
  azimuths: number[];
  mapCoordinates: [number, number];
  reflectivity: HighResData[];
  stationCoordinates: [number, number];
}) {
  const indices = d3.range(GRID_SIZE);
  const grid: MultiPoint = {
    coordinates: d3.cross(indices, indices, (x, y) => [
      (x + 0.5) * CELL_SIZE,
      (y + 0.5) * CELL_SIZE,
    ]),
    type: "MultiPoint",
  };
  const gridPath =
    d3.geoPath(d3.geoIdentity()).pointRadius(CELL_SIZE / 6)(grid) ?? "";

  const circle: Point = {
    coordinates: [MAP_SIZE / 2, MAP_SIZE / 2],
    type: "Point",
  };

  const paths = reflectivityBands.map((reflectivity) => ({
    count: 100,
    d:
      d3.geoPath(d3.geoIdentity()).pointRadius(radiusScale(reflectivity))(
        circle,
      ) ?? "",
    reflectivity,
  }));

  return { grid, gridPath, mapSize: MAP_SIZE, paths };
}
