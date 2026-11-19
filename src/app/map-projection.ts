import type { FeatureCollection, MultiPoint } from "geojson";
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

const EARTH_RADIUS_KILOMETERS = 6371.0088;
const MAP_RADIUS_KILOMETERS = 250;
const RADIANS_TO_DEGREES = 180 / Math.PI;

export type MapBounds = [
  west: number,
  south: number,
  east: number,
  north: number,
];

function getBoundsForRadius(
  latitude: number,
  longitude: number,
  radiusKilometers: number,
): MapBounds {
  const center: [longitude: number, latitude: number] = [longitude, latitude];
  const angularDistance =
    (radiusKilometers / EARTH_RADIUS_KILOMETERS) * RADIANS_TO_DEGREES;
  const rotation = d3.geoRotation([-center[0], -center[1]]);
  const [west] = rotation.invert([-angularDistance, 0]);
  const [east] = rotation.invert([angularDistance, 0]);
  const [, south] = rotation.invert([0, -angularDistance]);
  const [, north] = rotation.invert([0, angularDistance]);

  return [west, south, east, north];
}

export function getMapBounds(latitude: number, longitude: number): MapBounds {
  return getBoundsForRadius(latitude, longitude, MAP_RADIUS_KILOMETERS);
}

export function getVisibleFeatures(
  features: FeatureCollection,
  path: ReturnType<typeof d3.geoPath>,
): FeatureCollection {
  return {
    features: features.features.filter((featureToCheck) => {
      const [[left, top], [right, bottom]] = path.bounds(featureToCheck);
      return left <= MAP_SIZE && top <= MAP_SIZE && right >= 0 && bottom >= 0;
    }),
    type: "FeatureCollection",
  };
}
