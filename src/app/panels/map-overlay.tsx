import React from "react";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { geoIdentity, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { MapBounds } from "./map-bounds";
import { getMapBounds } from "./map-bounds";
import { getSatelliteProjection, MAP_DIMENSION } from "./map-projection";

const COUNTRY_BOUNDARIES_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";
const PRIMARY_ROADS_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/1/query";
const STATE_BOUNDARIES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
type CountriesTopology = {
  objects: { countries: Parameters<typeof feature>[1] };
} & Parameters<typeof feature>[0];
type StatesTopology = {
  objects: { states: Parameters<typeof feature>[1] };
} & Parameters<typeof feature>[0];

function getVisibleFeatures(
  features: FeatureCollection,
  path: ReturnType<typeof geoPath>,
): FeatureCollection {
  return {
    features: features.features.filter((featureToCheck) => {
      const [[left, top], [right, bottom]] = path.bounds(featureToCheck);
      return (
        left <= MAP_DIMENSION &&
        top <= MAP_DIMENSION &&
        right >= 0 &&
        bottom >= 0
      );
    }),
    type: "FeatureCollection",
  };
}

async function getCountryBoundaries(): Promise<FeatureCollection> {
  try {
    const response = await fetch(COUNTRY_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = (await response.json()) as CountriesTopology;
    const countries = feature(
      topology,
      topology.objects.countries,
    ) as FeatureCollection;

    return countries;
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

async function getPrimaryRoads(bounds: MapBounds): Promise<FeatureCollection> {
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

    const roads = (await response.json()) as FeatureCollection;
    return roads.type === "FeatureCollection"
      ? roads
      : { features: [], type: "FeatureCollection" };
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

async function getStateBoundaries(): Promise<FeatureCollection> {
  try {
    const response = await fetch(STATE_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = (await response.json()) as StatesTopology;
    const states = feature(
      topology,
      topology.objects.states,
    ) as FeatureCollection;

    return states;
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

export async function MapOverlay({
  latitude,
  longitude,
  projection = "identity",
  radarLayer,
}: {
  latitude: number;
  longitude: number;
  projection?: "identity" | "satellite";
  radarLayer?: React.ReactNode;
}): Promise<React.JSX.Element> {
  const mapProjection =
    projection === "satellite"
      ? getSatelliteProjection(latitude, longitude)
      : geoIdentity().reflectY(true);
  const bounds = getMapBounds(latitude, longitude);
  const [countries, roads, states] = await Promise.all([
    getCountryBoundaries(),
    getPrimaryRoads(bounds),
    getStateBoundaries(),
  ]);
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
  if (projection === "identity")
    mapProjection.fitExtent(fitExtent, boundsGeometry);
  const path = geoPath(mapProjection);
  const countryPath = path(getVisibleFeatures(countries, path));
  const roadPath = path(roads);
  const statePath = path(getVisibleFeatures(states, path));

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${MAP_DIMENSION} ${MAP_DIMENSION}`}
    >
      <rect fill="black" height={MAP_DIMENSION} width={MAP_DIMENSION} />
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
      {radarLayer}
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
