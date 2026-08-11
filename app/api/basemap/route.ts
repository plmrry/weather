import { type NextRequest, NextResponse } from "next/server"
import { feature } from "topojson-client"
import { geoBounds } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"

// Static, government/open reference geodata for a black-and-white basemap:
//   - State boundaries: US Census cartographic states (via us-atlas TopoJSON)
//   - Primary roads:    US Census TIGERweb ArcGIS REST (queried per bounding box)
//   - Cities:           Natural Earth populated places (filtered to the box)
const US_STATES_TOPOJSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
const NE_CITIES =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/master/10m/cultural/ne_10m_populated_places_simple.json"
// Layer 1 = "Primary Roads (2.1M scale)" — interstates + US/state highways.
const TIGER_PRIMARY_ROADS =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation/MapServer/1/query"

type BBox = [number, number, number, number] // [minx, miny, maxx, maxy]
type City = { name: string; lon: number; lat: number; pop: number; capital: boolean }

// The static datasets are identical for every request, so fetch + parse them
// once per server instance and memoize the promise.
let statesPromise: Promise<Feature[]> | null = null
let citiesPromise: Promise<City[]> | null = null

function loadStates(): Promise<Feature[]> {
  if (!statesPromise) {
    statesPromise = (async () => {
      const res = await fetch(US_STATES_TOPOJSON)
      if (!res.ok) throw new Error(`states fetch ${res.status}`)
      const topo = await res.json()
      const fc = feature(topo, topo.objects.states) as unknown as FeatureCollection
      return fc.features
    })().catch((e) => {
      statesPromise = null // allow retry on next request
      throw e
    })
  }
  return statesPromise
}

function loadCities(): Promise<City[]> {
  if (!citiesPromise) {
    citiesPromise = (async () => {
      const res = await fetch(NE_CITIES)
      if (!res.ok) throw new Error(`cities fetch ${res.status}`)
      const fc = (await res.json()) as FeatureCollection
      return fc.features
        .filter((f) => f.geometry?.type === "Point")
        .map((f) => {
          const [lon, lat] = (f.geometry as { coordinates: [number, number] }).coordinates
          const p = f.properties ?? {}
          return {
            name: String(p.name ?? p.nameascii ?? "—"),
            lon,
            lat,
            pop: Number(p.pop_max ?? 0),
            capital: Number(p.adm0cap ?? 0) === 1 || Number(p.adm1cap ?? 0) === 1,
          }
        })
    })().catch((e) => {
      citiesPromise = null
      throw e
    })
  }
  return citiesPromise
}

// True when a feature's geographic bounds intersect the query box.
function intersects(f: Feature, [minx, miny, maxx, maxy]: BBox): boolean {
  try {
    const [[west, south], [east, north]] = geoBounds(f)
    return west <= maxx && east >= minx && south <= maxy && north >= miny
  } catch {
    return false
  }
}

async function fetchRoads(bbox: BBox): Promise<FeatureCollection> {
  const params = new URLSearchParams({
    where: "1=1",
    geometry: bbox.join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: "NAME",
    outSR: "4326",
    returnGeometry: "true",
    // Generalize geometry (~0.01° ≈ 1km) so a several-degree box stays ~100KB.
    maxAllowableOffset: "0.01",
    resultRecordCount: "2000",
    f: "geojson",
  })
  try {
    const res = await fetch(`${TIGER_PRIMARY_ROADS}?${params.toString()}`, { cache: "no-store" })
    if (!res.ok) return { type: "FeatureCollection", features: [] }
    const fc = (await res.json()) as FeatureCollection
    if (!fc || fc.type !== "FeatureCollection") return { type: "FeatureCollection", features: [] }
    return fc
  } catch {
    return { type: "FeatureCollection", features: [] }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nums = ["minx", "miny", "maxx", "maxy"].map((k) => Number.parseFloat(searchParams.get(k) ?? ""))
  if (nums.some((n) => Number.isNaN(n))) {
    return NextResponse.json({ error: "Provide numeric minx, miny, maxx, maxy." }, { status: 400 })
  }
  const bbox = nums as BBox
  const [minx, miny, maxx, maxy] = bbox

  const [allStates, allCities, roads] = await Promise.all([
    loadStates().catch(() => [] as Feature[]),
    loadCities().catch(() => [] as City[]),
    fetchRoads(bbox),
  ])

  const states: FeatureCollection<Geometry> = {
    type: "FeatureCollection",
    features: allStates.filter((f) => intersects(f, bbox)),
  }

  const cities = allCities
    .filter((c) => c.lon >= minx && c.lon <= maxx && c.lat >= miny && c.lat <= maxy)
    .sort((a, b) => b.pop - a.pop)
    .slice(0, 14)

  return NextResponse.json(
    { bbox, states, roads, cities, retrievedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  )
}
