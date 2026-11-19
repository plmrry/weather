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

const reflectivityMin = 20;

const reflectivityMax = 40;

export const reflectivityRange = d3.range(reflectivityMin, reflectivityMax, 5);

export const reflectivityDomain = [reflectivityMin, reflectivityMax];

export const reflectivityColorScale = d3
  .scaleSequential(d3.interpolatePlasma)
  .domain(reflectivityDomain)
  .clamp(true);

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
