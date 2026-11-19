import type { MultiPoint } from "geojson";
import * as d3 from "d3";
import { geoSatellite } from "d3-geo-projection";

export const MAP_SIZE = 600;

const HALF_SIZE = MAP_SIZE / 2;

const EDGE_POINTS: [number, number][] = [
  [HALF_SIZE, 0],
  [HALF_SIZE, MAP_SIZE],
  [MAP_SIZE, HALF_SIZE],
  [0, HALF_SIZE],
];

const SATELLITE_DISTANCE = 16;

const SATELLITE_SCALE = 7000;
export const reflectivityRange = d3.range(5, 55, 5);

export const reflectivityDomain = [0, 50];

export const reflectivityColorScale = d3
  .scaleSequential(d3.interpolateTurbo)
  .domain(reflectivityDomain)
  .clamp(true);

export const bearingQuantizeScale = d3
  .scaleQuantize<string>()
  .domain([0, 360])
  .range(d3.range(0, 360).map(String));

export const reflectivityQuantizeScale = d3
  .scaleQuantize<number>()
  .domain(reflectivityDomain)
  .range(reflectivityRange);

export function getSatelliteProjection(latitude: number, longitude: number) {
  const projection = geoSatellite()
    .distance(SATELLITE_DISTANCE)
    .scale(SATELLITE_SCALE)
    .translate([HALF_SIZE, HALF_SIZE])
    .rotate([-longitude, -latitude])
    .clipExtent([
      [0, 0],
      [MAP_SIZE, MAP_SIZE],
    ])
    .precision(0.1);
  const geometry: MultiPoint = {
    coordinates: EDGE_POINTS.flatMap((point) => {
      const coordinate = projection.invert?.(point);
      return coordinate ? [coordinate] : [];
    }),
    type: "MultiPoint",
  };
  return projection.fitSize([MAP_SIZE, MAP_SIZE], geometry);
}
