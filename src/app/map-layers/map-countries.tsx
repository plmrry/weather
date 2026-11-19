import React from "react";
import * as d3 from "d3";
import * as GeoJSON from "geojson";
import { cacheLife, cacheTag, io } from "next/cache";
import * as topoJSON from "topojson-client";
import { LoadingSpinner } from "#/app/loading-spinner";
import {
  getSatelliteProjection,
  getVisibleFeatures,
} from "#/app/map-projection";
import { MapSvg } from "#/app/map-svg";

const COUNTRY_BOUNDARIES_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";

type Topology = Parameters<typeof topoJSON.feature>[0];

export function MapCountries({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="MapCountries">
      <MapCountriesRendered params={params} />
    </React.Suspense>
  );
}

async function MapCountriesRendered({
  params: paramsPromise,
}: {
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  "use cache: remote";
  cacheLife("max");
  cacheTag("map-layer");

  await io();

  const [features, params] = await Promise.all([
    getCountryBoundaries(),
    paramsPromise,
  ]);

  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);
  const mapProjection = getSatelliteProjection(latitude, longitude);
  const path = d3.geoPath(mapProjection);
  const visibleFeatures = getVisibleFeatures(features, path);
  const layerPath = path(visibleFeatures);
  if (!layerPath) return null;

  return (
    <MapSvg aria-hidden="true" data-map-layer="countries">
      <path
        d={layerPath}
        fill="white"
        fillOpacity="0.3"
        fillRule="evenodd"
        stroke="white"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </MapSvg>
  );
}

async function getCountryBoundaries(): Promise<GeoJSON.FeatureCollection> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("map-layer");

  await io();

  try {
    const response = await fetch(COUNTRY_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = (await response.json()) as Topology;
    const countries = topology.objects.countries;
    if (countries.type !== "GeometryCollection") {
      return { features: [], type: "FeatureCollection" };
    }

    return topoJSON.feature(topology, countries);
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}
