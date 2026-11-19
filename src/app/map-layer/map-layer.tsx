import React from "react";
import * as d3 from "d3";
import * as GeoJSON from "geojson";
import { cacheLife, cacheTag } from "next/cache";
import * as topoJSON from "topojson-client";
import type { MapBounds } from "#/app/map-layer/map-bounds";
import { ErrorBoundary } from "#/app/error-boundary";
import { LoadingSpinner } from "#/app/loading-spinner";
import { getMapBounds } from "#/app/map-layer/map-bounds";
import { getSatelliteProjection, MAP_SIZE } from "#/app/map-projection";

const COUNTRY_BOUNDARIES_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";
const PRIMARY_ROADS_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/1/query";
const STATE_BOUNDARIES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export function MapLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  return (
    <React.Suspense fallback={<LoadingSpinner />} name="MapLayer">
      <ErrorBoundary>
        <MapLayerCached params={params} />
      </ErrorBoundary>
    </React.Suspense>
  );
}

async function MapLayerCached({
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
  const bounds = getMapBounds(latitude, longitude);
  const [countries, roads, states] = await Promise.allSettled([
    getCountryBoundaries(),
    getPrimaryRoads(bounds),
    getStateBoundaries(),
  ]);
  const path = d3.geoPath(mapProjection);
  const visibleCountries = getVisibleFeatures(countries.value, path);
  const countryPath =
    countries.status === "fulfilled" ? path(visibleCountries) : null;
  const roadPath = roads.status === "fulfilled" ? path(roads.value) : null;
  const statePath =
    states.status === "fulfilled"
      ? path(getVisibleFeatures(states.value, path))
      : null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
    >
      <rect fill="black" height={MAP_SIZE} width={MAP_SIZE} />
      {countryPath ? (
        <path
          d={countryPath}
          fill="white"
          fillOpacity="0.3"
          fillRule="evenodd"
          stroke="white"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
      {roadPath ? (
        <path
          d={roadPath}
          fill="none"
          stroke="white"
          strokeOpacity="0.7"
          strokeWidth="1"
        />
      ) : null}
      {statePath ? (
        <path
          d={statePath}
          fill="none"
          stroke="white"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}

function getVisibleFeatures(
  features: GeoJSON.FeatureCollection,
  path: ReturnType<typeof d3.geoPath>,
) {
  return {
    features: features.features.filter((featureToCheck) => {
      const [[left, top], [right, bottom]] = path.bounds(featureToCheck);
      return left <= MAP_SIZE && top <= MAP_SIZE && right >= 0 && bottom >= 0;
    }),
    type: "FeatureCollection",
  };
}

async function getCountryBoundaries() {
  try {
    const response = await fetch(COUNTRY_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = await response.json();
    const countries = topoJSON.feature(topology, topology.objects.countries);

    return countries;
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

async function getPrimaryRoads(bounds: MapBounds) {
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

    const roads = await response.json();
    return roads.type === "FeatureCollection"
      ? roads
      : { features: [], type: "FeatureCollection" };
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

async function getStateBoundaries() {
  try {
    const response = await fetch(STATE_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = await response.json();
    const states = topoJSON.feature(topology, topology.objects.states);

    return states;
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}
