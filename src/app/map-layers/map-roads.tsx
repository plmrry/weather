import React from "react";
import * as d3 from "d3";
import * as GeoJSON from "geojson";
import { cacheLife, cacheTag } from "next/cache";
import type { MapBounds } from "#/app/map-projection";
import { LoadingSpinner } from "#/app/loading-spinner";
import { getMapBounds, getSatelliteProjection } from "#/app/map-projection";
import { MapSvg } from "#/app/map-svg";

const PRIMARY_ROADS_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/1/query";

export function MapRoads({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  return (
    <React.Suspense fallback={<LoadingSpinner />} name="MapRoads">
      <MapRoadsCached params={params} />
    </React.Suspense>
  );
}

async function MapRoadsCached({
  params: paramsPromise,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  "use cache: remote";
  cacheLife("max");
  cacheTag("map-layer");

  const params = await paramsPromise;
  if (!params) return null;

  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);
  const mapProjection = getSatelliteProjection(latitude, longitude);
  const features = await getPrimaryRoads(getMapBounds(latitude, longitude));
  const path = d3.geoPath(mapProjection);
  const layerPath = path(features);
  if (!layerPath) return null;

  return (
    <MapSvg aria-hidden="true" data-map-layer="roads">
      <path
        d={layerPath}
        fill="none"
        stroke="white"
        strokeOpacity="0.7"
        strokeWidth="1"
      />
    </MapSvg>
  );
}

async function getPrimaryRoads(
  bounds: MapBounds,
): Promise<GeoJSON.FeatureCollection> {
  const searchParams = new URLSearchParams({
    f: "geojson",
    geometry: bounds.join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    maxAllowableOffset: "0.01",
    outFields: "OBJECTID",
    outSR: "4326",
    resultRecordCount: "2000",
    returnGeometry: "true",
    spatialRel: "esriSpatialRelIntersects",
    where: "1=1",
  });

  try {
    const response = await fetch(`${PRIMARY_ROADS_URL}?${searchParams}`);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const roads = (await response.json()) as GeoJSON.FeatureCollection;
    return roads.type === "FeatureCollection"
      ? roads
      : { features: [], type: "FeatureCollection" };
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}
