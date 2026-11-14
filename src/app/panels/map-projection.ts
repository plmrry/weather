import { geoSatellite } from "d3-geo-projection";

export const MAP_DIMENSION = 600;
const SATELLITE_DISTANCE = 16;
const SATELLITE_SCALE = 3000;

export function getSatelliteProjection(latitude: number, longitude: number) {
  return geoSatellite()
    .distance(SATELLITE_DISTANCE)
    .scale(SATELLITE_SCALE)
    .translate([MAP_DIMENSION / 2, MAP_DIMENSION / 2])
    .rotate([-longitude, -latitude])
    .clipExtent([
      [0, 0],
      [MAP_DIMENSION, MAP_DIMENSION],
    ])
    .precision(0.1);
}
