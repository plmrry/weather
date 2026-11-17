declare module "d3-geo-projection" {
  import type { GeoProjection } from "d3";

  interface GeoSatelliteProjection extends GeoProjection {
    distance(): number;
    distance(distance: number): GeoSatelliteProjection;
    tilt(): number;
    tilt(angle: number): GeoSatelliteProjection;
  }

  export function geoSatellite(): GeoSatelliteProjection;
}
