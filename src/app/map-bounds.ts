import { geoRotation } from "d3-geo";

const EARTH_RADIUS_KILOMETERS = 6371.0088;
const MAP_RADIUS_KILOMETERS = 250;
const RADIANS_TO_DEGREES = 180 / Math.PI;

export type MapBounds = [
  west: number,
  south: number,
  east: number,
  north: number,
];

export function getBoundsForRadius(
  latitude: number,
  longitude: number,
  radiusKilometers: number,
): MapBounds {
  const center: [longitude: number, latitude: number] = [longitude, latitude];
  const angularDistance =
    (radiusKilometers / EARTH_RADIUS_KILOMETERS) * RADIANS_TO_DEGREES;
  const rotation = geoRotation([-center[0], -center[1]]);
  const [west] = rotation.invert([-angularDistance, 0]);
  const [east] = rotation.invert([angularDistance, 0]);
  const [, south] = rotation.invert([0, -angularDistance]);
  const [, north] = rotation.invert([0, angularDistance]);

  return [west, south, east, north];
}

export function getMapBounds(latitude: number, longitude: number): MapBounds {
  return getBoundsForRadius(latitude, longitude, MAP_RADIUS_KILOMETERS);
}
