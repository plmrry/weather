import { cacheLife } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

const NWS_BASE = "https://api.weather.gov";
// NOAA's primary archive bucket (`noaa-nexrad-level2`) blocks anonymous
// ListBucket. This Unidata-maintained public bucket serves the same raw
// NEXRAD Level II volume scans, allows anonymous listing, and uses the
// identical YYYY/MM/DD/STATION/ key layout — including real-time data.
const NEXRAD_BUCKET = "https://unidata-nexrad-level2.s3.amazonaws.com";

// api.weather.gov requires a descriptive User-Agent identifying the app.
const USER_AGENT = "v0-noaa-radar-explorer (contact: example@example.com)";

type RadarFile = {
  key: string;
  name: string;
  url: string;
  size: number;
  lastModified: string | null;
  scanTime: string | null;
};

// Web-Mercator tile index for a coordinate at a given zoom (integer tile).
function lonLatToTile(lon: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

type ImageryBundle = {
  // NWS RIDGE — government-rendered, per-station standalone images.
  ridge: { latestUrl: string; loopUrl: string };
  // Iowa Environmental Mesonet — WMS base-reflectivity mosaic around the point.
  iem: { reflectivityUrl: string; bbox: number[] };
  // RainViewer — global near-real-time mosaic (+ nowcast when active), tiled.
  rainviewer: {
    host: string;
    tileSize: number;
    zoom: number;
    color: number;
    options: string;
    center: { x: number; y: number };
    basemapTemplate: string;
    frames: { time: number; path: string; kind: "past" | "nowcast" }[];
  } | null;
};

// Build the live imagery bundle. Never cached — these change every few minutes.
async function buildImagery(stationId: string, lat: number, lon: number): Promise<ImageryBundle> {
  const zoom = 7;
  const center = lonLatToTile(lon, lat, zoom);

  // IEM WMS GetMap: ~4° box centered on the point (EPSG:4326, minx,miny,maxx,maxy).
  const bbox = [lon - 2, lat - 2, lon + 2, lat + 2];
  const reflectivityUrl =
    "https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?" +
    new URLSearchParams({
      BBOX: bbox.join(","),
      FORMAT: "image/png",
      HEIGHT: "600",
      LAYERS: "nexrad-n0q-900913",
      REQUEST: "GetMap",
      SERVICE: "WMS",
      SRS: "EPSG:4326",
      TRANSPARENT: "true",
      VERSION: "1.1.1",
      WIDTH: "600",
    }).toString();

  let rainviewer: ImageryBundle["rainviewer"] = null;
  try {
    const rv = await fetch("https://api.rainviewer.com/public/weather-maps.json", {
      cache: "no-store",
    });
    if (rv.ok) {
      const j = await rv.json();
      const host: string = j.host;
      const past = (j.radar?.past ?? []).map((f: { time: number; path: string }) => ({
        kind: "past" as const,
        path: f.path,
        time: f.time,
      }));
      const nowcast = (j.radar?.nowcast ?? []).map((f: { time: number; path: string }) => ({
        kind: "nowcast" as const,
        path: f.path,
        time: f.time,
      }));
      rainviewer = {
        basemapTemplate: "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        center,
        color: 4,
        frames: [...past, ...nowcast],
        host,
        options: "1_1",
        tileSize: 256,
        zoom,
      };
    }
  } catch {
    rainviewer = null;
  }

  return {
    iem: { bbox, reflectivityUrl },
    rainviewer,
    ridge: {
      latestUrl: `https://radar.weather.gov/ridge/standard/${stationId}_0.gif`,
      loopUrl: `https://radar.weather.gov/ridge/standard/${stationId}_loop.gif`,
    },
  };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract UTC scan time from a NEXRAD key like "2026/08/11/KMUX/KMUX20260811_120000_V06"
function parseScanTime(key: string): string | null {
  const m = key.match(/[A-Z]{4}(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  const t = Date.parse(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

// Minimal XML tag extraction for the S3 ListObjectsV2 response.
function extractAll(xml: string, tag: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) out.push(match[1]);
  return out;
}

function extractOne(block: string, tag: string): string | null {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1] : null;
}

async function listLevel2Files(stationId: string, date: Date): Promise<RadarFile[]> {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const prefix = `${y}/${mo}/${d}/${stationId}/`;
  const listUrl = `${NEXRAD_BUCKET}/?list-type=2&prefix=${encodeURIComponent(prefix)}&max-keys=1000`;

  const res = await fetch(listUrl, { cache: "no-store" });
  if (!res.ok) return [];
  const xml = await res.text();

  const files: RadarFile[] = extractAll(xml, "Contents")
    .map((block) => {
      const key = extractOne(block, "Key");
      if (!key) return null;
      // Skip index/sidecar objects, keep actual volume scans.
      if (key.endsWith("_MDM") || key.endsWith("/")) return null;
      const size = Number(extractOne(block, "Size") ?? "0");
      const lastModified = extractOne(block, "LastModified");
      const name = key.split("/").pop() ?? key;
      return {
        key,
        lastModified,
        name,
        scanTime: parseScanTime(key),
        size,
        url: `${NEXRAD_BUCKET}/${key}`,
      } satisfies RadarFile;
    })
    .filter((f): f is RadarFile => f !== null);

  // Most recent scan first.
  files.sort((a, b) => (b.scanTime ?? "").localeCompare(a.scanTime ?? ""));
  return files;
}

type StationResolution =
  | {
      ok: true;
      stationId: string;
      location: Record<string, unknown>;
      station: Record<string, unknown>;
      stationUrl: string;
      pointUrl: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
      location?: Record<string, unknown>;
      pointUrl: string;
    };

// The point -> radar-station mapping and station metadata are effectively static
// for a given location, so this lookup is cached. The live file listing below is not.
async function resolveStation(lat: number, lon: number): Promise<StationResolution> {
  "use cache";
  // Slowly-changing data (RDA status, latency): refresh at most hourly, serve stale meanwhile.
  cacheLife("hours");

  const headers = { Accept: "application/geo+json", "User-Agent": USER_AGENT };
  const pointUrl = `${NWS_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
  const pointRes = await fetch(pointUrl, { headers });

  if (!pointRes.ok) {
    if (pointRes.status === 404) {
      return {
        error:
          "No NWS data for this location. NEXRAD radar coverage is limited to the U.S. and territories.",
        ok: false,
        pointUrl,
        status: 404,
      };
    }
    return {
      error: `NWS points lookup failed (${pointRes.status}).`,
      ok: false,
      pointUrl,
      status: 502,
    };
  }

  const point = await pointRes.json();
  const props = point?.properties ?? {};
  const stationId: string | undefined = props.radarStation;
  const rel = props.relativeLocation?.properties ?? {};

  const location = {
    city: rel.city ?? null,
    forecastOffice: props.cwa ?? null,
    gridId: props.gridId ?? null,
    gridX: props.gridX ?? null,
    gridY: props.gridY ?? null,
    state: rel.state ?? null,
    timeZone: props.timeZone ?? null,
  };

  if (!stationId) {
    return {
      error: "No radar station associated with this point.",
      location,
      ok: false,
      pointUrl,
      status: 404,
    };
  }

  // Radar station metadata (RDA status, elevation, coordinates, latency).
  let station: Record<string, unknown> = { id: stationId };
  const stationUrl = `${NWS_BASE}/radar/stations/${stationId}`;
  const stationRes = await fetch(stationUrl, { headers });
  if (stationRes.ok) {
    const s = await stationRes.json();
    const sp = s?.properties ?? {};
    const coords: number[] | undefined = s?.geometry?.coordinates;
    const sLon = coords?.[0];
    const sLat = coords?.[1];
    station = {
      distanceKm:
        typeof sLat === "number" && typeof sLon === "number"
          ? Number(haversineKm(lat, lon, sLat, sLon).toFixed(1))
          : null,
      elevationMeters: sp.elevation?.value ?? null,
      id: stationId,
      lat: sLat ?? null,
      latencyAverageSeconds: sp.latency?.average?.value ?? null,
      latencyCurrentSeconds: sp.latency?.current?.value ?? null,
      lon: sLon ?? null,
      name: sp.name ?? null,
      rda: sp.rda?.properties
        ? {
            mode: sp.rda.properties.mode ?? null,
            operabilityStatus: sp.rda.properties.operabilityStatus ?? null,
            reflectivity: sp.rda.properties.reflectivity ?? null,
            volumeCoveragePattern: sp.rda.properties.volumeCoveragePattern ?? null,
          }
        : null,
      stationType: sp.stationType ?? null,
      timeZone: sp.timeZone ?? null,
    };
  }

  return { location, ok: true, pointUrl, station, stationId, stationUrl };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: "Provide valid numeric 'lat' and 'lon' query params." },
      { status: 400 },
    );
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Coordinates out of range." }, { status: 400 });
  }

  // 1) + 2) Resolve station (cached). Round coords to ~1km so nearby lookups share a cache entry.
  const resolved = await resolveStation(Number(lat.toFixed(2)), Number(lon.toFixed(2)));

  if (!resolved.ok) {
    return NextResponse.json(
      { error: resolved.error, location: resolved.location, query: { lat, lon } },
      { status: resolved.status },
    );
  }

  const { stationId, location, station, pointUrl, stationUrl } = resolved;

  const listUrlFor = (date: Date) => {
    const y = date.getUTCFullYear();
    const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${NEXRAD_BUCKET}/?list-type=2&prefix=${encodeURIComponent(`${y}/${mo}/${d}/${stationId}/`)}`;
  };

  // 3) List raw Level II volume-scan files live from the public S3 bucket, and
  //    build the live rendered-imagery bundle — in parallel.
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [todayFiles, imagery] = await Promise.all([
    listLevel2Files(stationId, now),
    buildImagery(stationId, lat, lon),
  ]);

  // Early in the UTC day the current-day prefix may be empty; fall back to yesterday.
  let files = todayFiles;
  let listedDate = now;
  if (files.length === 0) {
    files = await listLevel2Files(stationId, yesterday);
    listedDate = yesterday;
  }

  const bucketListing = listUrlFor(listedDate);

  return NextResponse.json({
    fileCount: files.length,
    files: files.slice(0, 50),
    imagery,
    location,
    query: { lat, lon },
    retrievedAt: new Date().toISOString(),
    sources: {
      bucketBrowser: bucketListing,
      bucketListing,
      pointJson: pointUrl,
      stationJson: stationUrl,
    },
    station,
  });
}
