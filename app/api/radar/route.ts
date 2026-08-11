import { type NextRequest, NextResponse } from "next/server"
import { cacheLife } from "next/cache"

const NWS_BASE = "https://api.weather.gov"
// Live raw NEXRAD Level II volume scans, served publicly by Unidata's THREDDS
// data server (NOAA's real-time S3 bucket blocks anonymous listing).
const THREDDS_BASE = "https://thredds.ucar.edu/thredds"

// api.weather.gov requires a descriptive User-Agent identifying the app.
const USER_AGENT = "v0-noaa-radar-explorer (contact: example@example.com)"

type RadarFile = {
  key: string
  name: string
  url: string
  size: number
  lastModified: string | null
  scanTime: string | null
}

// Extract UTC scan time from a Level II filename like "Level2_KMUX_20260811_2126.ar2v"
function parseScanTime(name: string): string | null {
  const m = name.match(/_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  const t = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:00Z`)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

// Parse a THREDDS dataset catalog into raw Level II volume-scan files.
function parseThreddsCatalog(xml: string): RadarFile[] {
  const files: RadarFile[] = []
  const re = /<dataset\b([^>]*)>([\s\S]*?)<\/dataset>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    const attrs = match[1]
    const body = match[2]
    const urlPath = attrs.match(/urlPath="([^"]*)"/)?.[1]
    const name = attrs.match(/name="([^"]*)"/)?.[1]
    // Only real volume-scan files have a urlPath and the .ar2v extension.
    if (!urlPath || !name || !name.endsWith(".ar2v")) continue

    const sizeMatch = body.match(/<dataSize units="([^"]*)">([\d.]+)<\/dataSize>/)
    let size = 0
    if (sizeMatch) {
      const val = Number.parseFloat(sizeMatch[2])
      const unit = sizeMatch[1].toLowerCase()
      const mult = unit.startsWith("mbyte") ? 1024 ** 2 : unit.startsWith("kbyte") ? 1024 : 1
      size = Math.round(val * mult)
    }
    const modified = body.match(/<date type="modified">([^<]*)<\/date>/)?.[1] ?? null

    files.push({
      key: urlPath,
      name,
      url: `${THREDDS_BASE}/fileServer/${urlPath}`,
      size,
      lastModified: modified,
      scanTime: parseScanTime(name),
    })
  }
  // Most recent scan first.
  files.sort((a, b) => (b.scanTime ?? "").localeCompare(a.scanTime ?? ""))
  return files
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Build the dated THREDDS catalog URL for a station, and fetch + parse its live listing.
async function listLevel2Files(stationId: string, date: Date): Promise<{ files: RadarFile[]; catalogUrl: string }> {
  const y = date.getUTCFullYear()
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  const day = `${y}${mo}${d}`
  const catalogUrl = `${THREDDS_BASE}/catalog/nexrad/level2/${stationId}/${day}/catalog.xml`

  const res = await fetch(catalogUrl, { cache: "no-store" })
  if (!res.ok) return { files: [], catalogUrl }
  const xml = await res.text()
  return { files: parseThreddsCatalog(xml), catalogUrl }
}

type StationResolution =
  | {
      ok: true
      stationId: string
      location: Record<string, unknown>
      station: Record<string, unknown>
      stationUrl: string
      pointUrl: string
    }
  | { ok: false; status: number; error: string; location?: Record<string, unknown>; pointUrl: string }

// The point -> radar-station mapping and station metadata change slowly for a
// given location, so this lookup is cached. The live file listing below is not.
async function resolveStation(lat: number, lon: number): Promise<StationResolution> {
  "use cache"
  cacheLife("hours")

  const headers = { "User-Agent": USER_AGENT, Accept: "application/geo+json" }
  const pointUrl = `${NWS_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`
  const pointRes = await fetch(pointUrl, { headers })

  if (!pointRes.ok) {
    if (pointRes.status === 404) {
      return {
        ok: false,
        status: 404,
        error: "No NWS data for this location. NEXRAD radar coverage is limited to the U.S. and territories.",
        pointUrl,
      }
    }
    return { ok: false, status: 502, error: `NWS points lookup failed (${pointRes.status}).`, pointUrl }
  }

  const point = await pointRes.json()
  const props = point?.properties ?? {}
  const stationId: string | undefined = props.radarStation
  const rel = props.relativeLocation?.properties ?? {}

  const location = {
    city: rel.city ?? null,
    state: rel.state ?? null,
    timeZone: props.timeZone ?? null,
    forecastOffice: props.cwa ?? null,
    gridId: props.gridId ?? null,
    gridX: props.gridX ?? null,
    gridY: props.gridY ?? null,
  }

  if (!stationId) {
    return { ok: false, status: 404, error: "No radar station associated with this point.", location, pointUrl }
  }

  // Radar station metadata (RDA status, elevation, coordinates, latency).
  let station: Record<string, unknown> = { id: stationId }
  const stationUrl = `${NWS_BASE}/radar/stations/${stationId}`
  const stationRes = await fetch(stationUrl, { headers })
  if (stationRes.ok) {
    const s = await stationRes.json()
    const sp = s?.properties ?? {}
    const coords: number[] | undefined = s?.geometry?.coordinates
    const sLon = coords?.[0]
    const sLat = coords?.[1]
    station = {
      id: stationId,
      name: sp.name ?? null,
      stationType: sp.stationType ?? null,
      lat: sLat ?? null,
      lon: sLon ?? null,
      elevationMeters: sp.elevation?.value ?? null,
      timeZone: sp.timeZone ?? null,
      distanceKm:
        typeof sLat === "number" && typeof sLon === "number"
          ? Number(haversineKm(lat, lon, sLat, sLon).toFixed(1))
          : null,
      rda: sp.rda?.properties
        ? {
            operabilityStatus: sp.rda.properties.operabilityStatus ?? null,
            mode: sp.rda.properties.mode ?? null,
            volumeCoveragePattern: sp.rda.properties.volumeCoveragePattern ?? null,
            reflectivity: sp.rda.properties.reflectivity ?? null,
          }
        : null,
      latencyCurrentSeconds: sp.latency?.current?.value ?? null,
      latencyAverageSeconds: sp.latency?.average?.value ?? null,
    }
  }

  return { ok: true, stationId, location, station, stationUrl, pointUrl }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = Number.parseFloat(searchParams.get("lat") ?? "")
  const lon = Number.parseFloat(searchParams.get("lon") ?? "")

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Provide valid numeric 'lat' and 'lon' query params." }, { status: 400 })
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Coordinates out of range." }, { status: 400 })
  }

  // 1) + 2) Resolve station (cached). Round coords so nearby lookups share a cache entry.
  const resolved = await resolveStation(Number(lat.toFixed(2)), Number(lon.toFixed(2)))

  if (!resolved.ok) {
    return NextResponse.json(
      { query: { lat, lon }, location: resolved.location ?? null, error: resolved.error },
      { status: resolved.status },
    )
  }

  const { stationId, location, station, pointUrl, stationUrl } = resolved

  // 3) List raw Level II volume-scan files live from the THREDDS catalog.
  const now = new Date()
  let { files, catalogUrl } = await listLevel2Files(stationId, now)
  if (files.length === 0) {
    // Early in the UTC day the current-day catalog may be empty; fall back to yesterday.
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const prev = await listLevel2Files(stationId, yesterday)
    files = prev.files
    catalogUrl = prev.catalogUrl
  }

  return NextResponse.json({
    query: { lat, lon },
    location,
    station,
    sources: {
      pointJson: pointUrl,
      stationJson: stationUrl,
      bucketListing: catalogUrl,
      bucketBrowser: catalogUrl.replace("catalog.xml", "catalog.html"),
    },
    fileCount: files.length,
    files: files.slice(0, 50),
    retrievedAt: new Date().toISOString(),
  })
}
