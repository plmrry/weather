import { geoBounds, geoIdentity, geoPath } from "d3-geo";
import { geoSatellite } from "d3-geo-projection";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { JSX } from "react";
import { feature } from "topojson-client";
import { getMapBounds, type MapBounds } from "./map-bounds";

const COUNTRY_BOUNDARIES_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json";
const PRIMARY_ROADS_URL =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/1/query";
const STATE_BOUNDARIES_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const SATELLITE_DISTANCE = 16;
const SATELLITE_SCALE = 3000;
type CountriesTopology = Parameters<typeof feature>[0] & {
  objects: { countries: Parameters<typeof feature>[1] };
};
type StatesTopology = Parameters<typeof feature>[0] & {
  objects: { states: Parameters<typeof feature>[1] };
};

function getLongitudeRanges(west: number, east: number): [west: number, east: number][] {
  return west <= east
    ? [[west, east]]
    : [
        [west, 180],
        [-180, east],
      ];
}

function intersects(featureToCheck: Feature, [west, south, east, north]: MapBounds): boolean {
  const [[featureWest, featureSouth], [featureEast, featureNorth]] = geoBounds(featureToCheck);
  const longitudeIntersects = getLongitudeRanges(featureWest, featureEast).some(
    ([featureRangeWest, featureRangeEast]) =>
      getLongitudeRanges(west, east).some(
        ([rangeWest, rangeEast]) => featureRangeWest <= rangeEast && featureRangeEast >= rangeWest,
      ),
  );

  return longitudeIntersects && featureSouth <= north && featureNorth >= south;
}

async function getCountryBoundaries(bounds: MapBounds): Promise<FeatureCollection> {
  try {
    const response = await fetch(COUNTRY_BOUNDARIES_URL);
    if (!response.ok) return { features: [], type: "FeatureCollection" };

    const topology = (await response.json()) as CountriesTopology;
    const countries = feature(topology, topology.objects.countries) as FeatureCollection;

    return {
      features: countries.features.filter((country) => intersects(country, bounds)),
      type: "FeatureCollection",
    };
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
    return roads.type === "FeatureCollection" ? roads : { features: [], type: "FeatureCollection" };
  } catch {
    return { features: [], type: "FeatureCollection" };
  }
}

async function getStateBoundaries(bounds: MapBounds): Promise<FeatureCollection> {
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

export async function MapOverlay({
  latitude,
  longitude,
  projection = "identity",
}: {
  latitude: number;
  longitude: number;
  projection?: "identity" | "satellite";
}): Promise<JSX.Element> {
  const mapProjection =
    projection === "satellite"
      ? geoSatellite()
          .distance(SATELLITE_DISTANCE)
          .scale(SATELLITE_SCALE)
          .translate([300, 300])
          .rotate([-longitude, -latitude])
          .precision(0.1)
      : geoIdentity().reflectY(true);
  const bounds = getMapBounds(latitude, longitude);
  const [countries, roads, states] = await Promise.all([
    getCountryBoundaries(bounds),
    getPrimaryRoads(bounds),
    getStateBoundaries(bounds),
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
    [600, 600],
  ];
  if (projection === "identity") mapProjection.fitExtent(fitExtent, boundsGeometry);
  const path = geoPath(mapProjection);
  const countryPath = path(countries);
  const roadPath = path(roads);
  const statePath = path(states);

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      preserveAspectRatio="none"
      viewBox="0 0 600 600"
    >
      <rect width="600" height="600" fill="white" fillOpacity="0.16" />
      {countryPath ? (
        <path
          d={countryPath}
          fill="black"
          stroke="white"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
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
