import zlib from "node:zlib";
import type { Sandbox } from "@vercel/sandbox";
import { fromArrayBuffer } from "geotiff";
import { PNG } from "pngjs";
import sharp from "sharp";
import type { RadarStationFeature } from "#/app/get-all-radar-stations";
import type { MapBounds } from "#/app/map-bounds";
import { getAllRadarStations } from "#/app/get-all-radar-stations";
import { getBoundsForRadius } from "#/app/map-bounds";
import { getSatelliteProjection, MAP_SIZE } from "#/app/map-projection";

const EARTH_RADIUS_KILOMETERS = 6371.0088;
const RADAR_TIMESTAMP_INTERVAL_MILLISECONDS = 10 * 60 * 1000;
const STATION_SEARCH_RADIUS_KILOMETERS = 1000;

type RadarSource = {
  bounds: MapBounds;
  height: number;
  pixels: Uint8Array;
  samplesPerPixel: number;
  width: number;
};

type StationRadarResult = {
  bytes: number;
  sources: RadarSource[];
};

export type RadarWorkflowPreparation = {
  stations: RadarStationFeature[];
  targetBounds: MapBounds[];
};

export type RadarBatchResult = {
  bytes: number;
  downloadedStationCount: number;
  png: Uint8Array;
  renderedStationCount: number;
};

type StoredRadarOverlay = {
  storedAt: number;
} & Omit<RadarOverlay, "dataUrl">;

function isStoredRadarOverlay(value: unknown): value is StoredRadarOverlay {
  if (!value || typeof value !== "object") return false;

  const overlay = value as Record<string, unknown>;
  return (
    typeof overlay.bytes === "number" &&
    typeof overlay.downloadedStationCount === "number" &&
    typeof overlay.renderedStationCount === "number" &&
    typeof overlay.stationCount === "number" &&
    typeof overlay.storedAt === "number"
  );
}

function getDistanceKilometers(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number {
  const degreesToRadians = Math.PI / 180;
  const latitudeDelta = (secondLatitude - firstLatitude) * degreesToRadians;
  const longitudeDelta = (secondLongitude - firstLongitude) * degreesToRadians;
  const firstLatitudeRadians = firstLatitude * degreesToRadians;
  const secondLatitudeRadians = secondLatitude * degreesToRadians;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KILOMETERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function getRadarProduct(
  stationType: RadarStationFeature["properties"]["stationType"],
): null | string {
  if (stationType === "WSR-88D") return "SR_BREF";
  if (stationType === "TDWR") return "BREFL";
  return null;
}

function getRequestBounds(bounds: MapBounds): MapBounds[] {
  const [west, south, east, north] = bounds;
  return west <= east
    ? [bounds]
    : [
        [west, south, 180, north],
        [-180, south, east, north],
      ];
}

function getIntersection(
  first: MapBounds,
  second: MapBounds,
): MapBounds | null {
  const west = Math.max(first[0], second[0]);
  const south = Math.max(first[1], second[1]);
  const east = Math.min(first[2], second[2]);
  const north = Math.min(first[3], second[3]);
  return west < east && south < north ? [west, south, east, north] : null;
}

async function readRadarSource(
  image: Awaited<
    ReturnType<Awaited<ReturnType<typeof fromArrayBuffer>>["getImage"]>
  >,
  tiffBuffer: Uint8Array,
  targetBounds: MapBounds,
): Promise<null | RadarSource> {
  const imageBounds = image.getBoundingBox() as MapBounds;
  const intersection = getIntersection(imageBounds, targetBounds);
  if (!intersection) return null;

  const imageWidth = image.getWidth();
  const imageHeight = image.getHeight();
  const [imageWest, imageSouth, imageEast, imageNorth] = imageBounds;
  const [west, south, east, north] = intersection;
  const xMinimum = Math.max(
    0,
    Math.floor(((west - imageWest) / (imageEast - imageWest)) * imageWidth),
  );
  const xMaximum = Math.min(
    imageWidth,
    Math.ceil(((east - imageWest) / (imageEast - imageWest)) * imageWidth),
  );
  const yMinimum = Math.max(
    0,
    Math.floor(
      ((imageNorth - north) / (imageNorth - imageSouth)) * imageHeight,
    ),
  );
  const yMaximum = Math.min(
    imageHeight,
    Math.ceil(((imageNorth - south) / (imageNorth - imageSouth)) * imageHeight),
  );
  const width = Math.max(1, Math.min(MAP_SIZE, xMaximum - xMinimum));
  const height = Math.max(1, Math.min(MAP_SIZE, yMaximum - yMinimum));
  const { data: pixels, info } = await sharp(tiffBuffer)
    .extract({
      height: yMaximum - yMinimum,
      left: xMinimum,
      top: yMinimum,
      width: xMaximum - xMinimum,
    })
    .resize(width, height, { fit: "fill", kernel: "nearest" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sourceWest =
    imageWest + (xMinimum / imageWidth) * (imageEast - imageWest);
  const sourceEast =
    imageWest + (xMaximum / imageWidth) * (imageEast - imageWest);
  const sourceNorth =
    imageNorth - (yMinimum / imageHeight) * (imageNorth - imageSouth);
  const sourceSouth =
    imageNorth - (yMaximum / imageHeight) * (imageNorth - imageSouth);

  return {
    bounds: [sourceWest, sourceSouth, sourceEast, sourceNorth],
    height,
    pixels: new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength),
    samplesPerPixel: info.channels,
    width,
  };
}

async function fetchStationRadar(
  station: RadarStationFeature,
  targetBounds: MapBounds[],
): Promise<null | StationRadarResult> {
  const product = getRadarProduct(station.properties.stationType);
  if (!product) return null;

  const fileUrl = await getLatestRidge2RadarFileUrl(
    station.properties.id,
    product,
  );
  if (!fileUrl) return null;

  const compressed = await getRadarFile(fileUrl);
  if (!compressed) return null;

  try {
    const uncompressed = zlib.gunzipSync(compressed);
    const tiffBytes = new Uint8Array(uncompressed);
    const tiff = await fromArrayBuffer(tiffBytes.slice().buffer);
    const image = await tiff.getImage();
    const sources = (
      await Promise.all(
        targetBounds.map((bounds) => readRadarSource(image, tiffBytes, bounds)),
      )
    ).filter((source): source is RadarSource => source !== null);
    return { bytes: compressed.byteLength, sources };
  } catch {
    return null;
  }
}

function getSourcePixel(
  source: RadarSource,
  longitude: number,
  latitude: number,
): [red: number, green: number, blue: number, alpha: number] | null {
  const [west, south, east, north] = source.bounds;
  if (
    longitude < west ||
    longitude > east ||
    latitude < south ||
    latitude > north
  )
    return null;

  const sourceX = Math.min(
    source.width - 1,
    Math.max(
      0,
      Math.floor(((longitude - west) / (east - west)) * source.width),
    ),
  );
  const sourceY = Math.min(
    source.height - 1,
    Math.max(
      0,
      Math.floor(((north - latitude) / (north - south)) * source.height),
    ),
  );
  const pixelIndex =
    (sourceY * source.width + sourceX) * source.samplesPerPixel;
  const red = source.pixels[pixelIndex] ?? 0;
  const green = source.pixels[pixelIndex + 1] ?? red;
  const blue = source.pixels[pixelIndex + 2] ?? red;
  const alpha =
    source.samplesPerPixel >= 4 ? (source.pixels[pixelIndex + 3] ?? 0) : 255;

  return alpha === 0 ? null : [red, green, blue, alpha];
}

function getProjectionCoordinates(
  latitude: number,
  longitude: number,
): { latitudes: Float32Array; longitudes: Float32Array } {
  const projection = getSatelliteProjection(latitude, longitude);
  const latitudes = new Float32Array(MAP_SIZE * MAP_SIZE);
  const longitudes = new Float32Array(MAP_SIZE * MAP_SIZE);
  latitudes.fill(Number.NaN);
  longitudes.fill(Number.NaN);

  for (let y = 0; y < MAP_SIZE; y += 1) {
    for (let x = 0; x < MAP_SIZE; x += 1) {
      const coordinate = projection.invert?.([x + 0.5, y + 0.5]);
      if (!coordinate) continue;

      const coordinateIndex = y * MAP_SIZE + x;
      longitudes[coordinateIndex] = coordinate[0];
      latitudes[coordinateIndex] = coordinate[1];
    }
  }

  return { latitudes, longitudes };
}

function renderRadarSources(
  png: PNG,
  sources: RadarSource[],
  latitudes: Float32Array,
  longitudes: Float32Array,
): boolean {
  let rendered = false;

  for (
    let coordinateIndex = 0;
    coordinateIndex < latitudes.length;
    coordinateIndex += 1
  ) {
    const latitude = latitudes[coordinateIndex];
    const longitude = longitudes[coordinateIndex];
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    let pixel: [number, number, number, number] | null = null;
    for (const source of sources) {
      pixel = getSourcePixel(source, longitude, latitude);
      if (pixel) break;
    }
    if (!pixel) continue;

    const outputIndex = coordinateIndex * 4;
    png.data[outputIndex] = pixel[0];
    png.data[outputIndex + 1] = pixel[1];
    png.data[outputIndex + 2] = pixel[2];
    png.data[outputIndex + 3] = pixel[3];
    rendered = true;
  }

  return rendered;
}

export async function getRadarTimestampStep(): Promise<number> {
  "use step";
  const timestamp =
    Math.floor(Date.now() / RADAR_TIMESTAMP_INTERVAL_MILLISECONDS) *
    RADAR_TIMESTAMP_INTERVAL_MILLISECONDS;
  console.log("Created radar timestamp", { timestamp });
  return timestamp;
}

export async function readRadarOverlayStep(
  sandbox: Sandbox,
  storagePath: string,
): Promise<null | RadarOverlay> {
  "use step";
  console.log("Reading radar overlay from persistent drive", { storagePath });

  const [metadataBuffer, pngBuffer] = await Promise.all([
    sandbox.readFileToBuffer({ path: `${storagePath}/radar.json` }),
    sandbox.readFileToBuffer({ path: `${storagePath}/radar.png` }),
  ]);
  if (!metadataBuffer || !pngBuffer) return null;

  let metadata: unknown;
  try {
    metadata = JSON.parse(metadataBuffer.toString("utf8"));
  } catch {
    return null;
  }
  if (!isStoredRadarOverlay(metadata)) return null;

  console.log("Read radar overlay from persistent drive", { storagePath });
  return {
    bytes: metadata.bytes,
    dataUrl: `data:image/png;base64,${pngBuffer.toString("base64")}`,
    downloadedStationCount: metadata.downloadedStationCount,
    renderedStationCount: metadata.renderedStationCount,
    stationCount: metadata.stationCount,
  };
}

export async function writeRadarOverlayStep(
  sandbox: Sandbox,
  storagePath: string,
  timestamp: number,
  radarOverlay: RadarOverlay,
): Promise<void> {
  "use step";
  console.log("Writing radar overlay to persistent drive", { storagePath });

  const pngPrefix = "data:image/png;base64,";
  if (!radarOverlay.dataUrl.startsWith(pngPrefix))
    throw new Error("Radar overlay is not a PNG data URL");

  const metadata: StoredRadarOverlay = {
    bytes: radarOverlay.bytes,
    downloadedStationCount: radarOverlay.downloadedStationCount,
    renderedStationCount: radarOverlay.renderedStationCount,
    stationCount: radarOverlay.stationCount,
    storedAt: timestamp,
  };
  const metadataContent = Buffer.from(JSON.stringify(metadata));
  const pngContent = Buffer.from(
    radarOverlay.dataUrl.slice(pngPrefix.length),
    "base64",
  );
  await sandbox.writeFiles([
    {
      content: metadataContent,
      path: `${storagePath}/radar.json`,
    },
    {
      content: pngContent,
      path: `${storagePath}/radar.png`,
    },
  ]);
  console.log("Wrote radar overlay to persistent drive", { storagePath });
}

export async function prepareRadarWorkflowStep(
  latitude: number,
  longitude: number,
): Promise<RadarWorkflowPreparation> {
  "use step";
  console.log("Preparing radar workflow", { latitude, longitude });

  const stations = await getAllRadarStations();
  const nearbyStations = stations
    .map((station) => ({
      distance: getDistanceKilometers(
        latitude,
        longitude,
        station.geometry.coordinates[1],
        station.geometry.coordinates[0],
      ),
      station,
    }))
    .filter(({ distance }) => distance <= STATION_SEARCH_RADIUS_KILOMETERS)
    .sort((first, second) => second.distance - first.distance)
    .map(({ station }) => station);
  const targetBounds = getRequestBounds(
    getBoundsForRadius(latitude, longitude, STATION_SEARCH_RADIUS_KILOMETERS),
  );

  console.log("Prepared radar workflow", {
    latitude,
    longitude,
    stationCount: nearbyStations.length,
  });
  return { stations: nearbyStations, targetBounds };
}

export async function renderRadarBatchStep(
  latitude: number,
  longitude: number,
  stations: RadarStationFeature[],
  targetBounds: MapBounds[],
): Promise<RadarBatchResult> {
  "use step";
  console.log("Rendering radar batch", {
    stationIds: stations.map((station) => station.properties.id),
  });

  const png = new PNG({ height: MAP_SIZE, width: MAP_SIZE });
  const { latitudes, longitudes } = getProjectionCoordinates(
    latitude,
    longitude,
  );
  const results = await Promise.all(
    stations.map((station) => fetchStationRadar(station, targetBounds)),
  );
  let bytes = 0;
  let downloadedStationCount = 0;
  let renderedStationCount = 0;

  for (const result of results) {
    if (!result) continue;
    bytes += result.bytes;
    downloadedStationCount += 1;
    if (renderRadarSources(png, result.sources, latitudes, longitudes))
      renderedStationCount += 1;
  }

  console.log("Rendered radar batch", {
    downloadedStationCount,
    renderedStationCount,
  });
  return {
    bytes,
    downloadedStationCount,
    png: new Uint8Array(PNG.sync.write(png)),
    renderedStationCount,
  };
}

export async function compositeRadarBatchesStep(
  batches: RadarBatchResult[],
  stationCount: number,
): Promise<null | RadarOverlay> {
  "use step";
  console.log("Compositing radar batches", {
    batchCount: batches.length,
    stationCount,
  });

  const png = new PNG({ height: MAP_SIZE, width: MAP_SIZE });
  let bytes = 0;
  let downloadedStationCount = 0;
  let renderedStationCount = 0;

  for (const batch of batches) {
    bytes += batch.bytes;
    downloadedStationCount += batch.downloadedStationCount;
    renderedStationCount += batch.renderedStationCount;
    const batchPng = PNG.sync.read(Buffer.from(batch.png));
    for (let index = 0; index < batchPng.data.length; index += 4) {
      if (batchPng.data[index + 3] === 0) continue;
      png.data[index] = batchPng.data[index];
      png.data[index + 1] = batchPng.data[index + 1];
      png.data[index + 2] = batchPng.data[index + 2];
      png.data[index + 3] = batchPng.data[index + 3];
    }
  }

  if (downloadedStationCount === 0) return null;

  const result = {
    bytes,
    dataUrl: `data:image/png;base64,${PNG.sync.write(png).toString("base64")}`,
    downloadedStationCount,
    renderedStationCount,
    stationCount,
  };
  console.log("Composited radar batches", {
    downloadedStationCount,
    renderedStationCount,
    stationCount,
  });
  return result;
}

const RIDGEII_URL = "https://mrms.ncep.noaa.gov/RIDGEII/L3";

export type RadarOverlay = {
  bytes: number;
  dataUrl: string;
  downloadedStationCount: number;
  renderedStationCount: number;
  stationCount: number;
};

export async function getLatestRidge2RadarFileUrl(
  stationId: string,
  product: string,
): Promise<null | string> {
  const productUrl = `${RIDGEII_URL}/${stationId}/${product}/`;
  const response = await fetch(productUrl);
  if (response.status === 429 || response.status >= 500)
    throw new Error(`Unable to fetch radar directory: ${response.status}`);
  if (!response.ok) return null;

  const html = await response.text();
  const filenames = [...html.matchAll(/href="([^"]+\.tif\.gz)"/g)]
    .map((match) => match[1])
    .sort();
  const filename = filenames.at(-1);
  return filename ? `${productUrl}${filename}` : null;
}

export async function getRadarFile(
  fileUrl: string,
): Promise<null | Uint8Array> {
  const response = await fetch(fileUrl);
  if (response.status === 429 || response.status >= 500)
    throw new Error(`Unable to fetch radar file: ${response.status}`);
  if (!response.ok) return null;

  return new Uint8Array(await response.arrayBuffer());
}
