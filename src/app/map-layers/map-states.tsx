import React from "react";
import * as d3 from "d3";
import * as GeoJSON from "geojson";
import { cacheLife, cacheTag } from "next/cache";
import * as topoJSON from "topojson-client";
import { LoadingSpinner } from "#/app/loading-spinner";
import {
  getSatelliteProjection,
  getVisibleFeatures,
} from "#/app/map-projection";
import { MapSvg } from "#/app/map-svg";

const STATE_BOUNDARIES_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

type Topology = Parameters<typeof topoJSON.feature>[0];

export function MapStates({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const stateBoundaries = getStateBoundaries();

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="MapStates">
      <MapStatesRendered params={params} stateBoundaries={stateBoundaries} />
    </React.Suspense>
  );
}

function MapStatesRendered({
  params: paramsPromise,
  stateBoundaries,
}: {
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
  stateBoundaries: Promise<GeoJSON.FeatureCollection>;
}) {
  const features = React.use(stateBoundaries);
  const params = React.use(paramsPromise);

  const latitude = Number(params.latitude);
  const longitude = Number(params.longitude);
  const mapProjection = getSatelliteProjection(latitude, longitude);
  const path = d3.geoPath(mapProjection);
  const visibleFeatures = getVisibleFeatures(features, path);
  const layerPath = path(visibleFeatures);
  if (!layerPath) return null;

  return (
    <MapSvg aria-hidden="true" data-map-layer="states">
      <path
        d={layerPath}
        fill="none"
        stroke="white"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </MapSvg>
  );
}

async function getStateBoundaries(): Promise<GeoJSON.FeatureCollection> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("map-layer");

  try {
    const response = await fetch(STATE_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = (await response.json()) as Topology;
    const states = topology.objects.states;
    if (states.type !== "GeometryCollection") {
      return { features: [], type: "FeatureCollection" };
    }

    return topoJSON.feature(topology, states);
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}
