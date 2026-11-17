import type { Feature, Geometry } from "geojson";
import { geoSatellite } from "d3-geo-projection";
import { getMapBounds } from "./map-bounds";

export const MAP_DIMENSION = 600;
const SATELLITE_DISTANCE = 16;
const SATELLITE_SCALE = 3000;

export function getSatelliteProjection(latitude: number, longitude: number) {
  const projection = geoSatellite()
    .distance(SATELLITE_DISTANCE)
    .scale(SATELLITE_SCALE)
    .translate([MAP_DIMENSION / 2, MAP_DIMENSION / 2])
    .rotate([-longitude, -latitude])
    .clipExtent([
      [0, 0],
      [MAP_DIMENSION, MAP_DIMENSION],
    ])
    .precision(0.1);
  const bounds = getMapBounds(latitude, longitude);
  const boundsGeometry: Feature<Geometry> = {
    geometry: {
      coordinates: [
        [
          [bounds[0], bounds[1]],
          [bounds[0], bounds[3]],
          [bounds[2], bounds[3]],
          [bounds[2], bounds[1]],
          [bounds[0], bounds[1]],
        ],
      ],
      type: "Polygon",
    },
    properties: {},
    type: "Feature",
  };
  const fitExtent: [[number, number], [number, number]] = [
    [0, 0],
    [MAP_DIMENSION, MAP_DIMENSION],
  ];
  return projection.fitExtent(fitExtent, boundsGeometry);
}
