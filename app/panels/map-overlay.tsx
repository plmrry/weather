import { geoBounds, geoIdentity, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { JSX } from "react";
import { feature } from "topojson-client";

const STATE_BOUNDARIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const PRIMARY_ROADS_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/1/query";

type Bounds = [west: number, south: number, east: number, north: number];
type StatesTopology = Parameters<typeof feature>[0] & {
  objects: { states: Parameters<typeof feature>[1] };
};

function intersects(featureToCheck: Feature, [west, south, east, north]: Bounds): boolean {
  const [[featureWest, featureSouth], [featureEast, featureNorth]] = geoBounds(featureToCheck);

  return (
    featureWest <= east && featureEast >= west && featureSouth <= north && featureNorth >= south
  );
}

async function getStateBoundaries(bounds: Bounds): Promise<FeatureCollection> {
  try {
    const response = await fetch(STATE_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = (await response.json()) as StatesTopology;
    const states = feature(topology, topology.objects.states) as FeatureCollection;

    return {
      features: states.features.filter((state) => intersects(state, bounds)),
      type: "FeatureCollection",
    };
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

async function getPrimaryRoads(bounds: Bounds): Promise<FeatureCollection> {
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
    return roads.type === "FeatureCollection" ? roads : { features: [], type: "FeatureCollection" };
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

export async function MapOverlay({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): Promise<JSX.Element> {
  const bounds: Bounds = [longitude - 2, latitude - 2, longitude + 2, latitude + 2];
  const [states, roads] = await Promise.all([getStateBoundaries(bounds), getPrimaryRoads(bounds)]);
  const boundsGeometry: Feature<Geometry> = {
    geometry: {
      coordinates: [
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[1]],
          [bounds[2], bounds[3]],
          [bounds[0], bounds[3]],
          [bounds[0], bounds[1]],
        ],
      ],
      type: "Polygon",
    },
    properties: {},
    type: "Feature",
  };
  const projection = geoIdentity()
    .reflectY(true)
    .fitExtent(
      [
        [0, 0],
        [600, 600],
      ],
      boundsGeometry,
    );
  const path = geoPath(projection);
  const statePath = path(states);
  const roadPath = path(roads);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      preserveAspectRatio="none"
      viewBox="0 0 600 600"
    >
      {roadPath ? (
        <path d={roadPath} fill="none" stroke="white" strokeOpacity="0.7" strokeWidth="1" />
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
