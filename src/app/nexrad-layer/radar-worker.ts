import workerThreads from "node:worker_threads";
import Level2Radar from "nexrad-level-2-data";
import { MAP_SIZE, reflectivityColorScale } from "../map-projection";
import { parseRadarData } from "./parse-radar-data";

const { bytes, mapCoordinates } = workerThreads.workerData as {
  bytes: Uint8Array;
  mapCoordinates: [number, number];
};
const { azimuths, reflectivity, stationCoordinates } =
  await getRadarData(bytes);
const parsed = parseRadarData({
  azimuths,
  mapCoordinates,
  reflectivity,
  stationCoordinates,
});
const layers = parsed.layers.map((layer) => ({
  ...layer,
  fill: reflectivityColorScale(layer.reflectivity),
}));
workerThreads.parentPort?.postMessage({ layers, mapSize: MAP_SIZE });

async function getRadarData(bytes: Uint8Array) {
  const radar = new Level2Radar(new Uint8Array(bytes));

  radar.setElevation(1);

  const reflectivity = radar.getHighresReflectivity();
  const azimuths = radar.getAzimuth();
  const header = radar.getHeader(0);
  const stationLatitude = header?.volume?.latitude;
  const stationLongitude = header?.volume?.longitude;

  if (
    stationLatitude === undefined ||
    stationLongitude === undefined ||
    !Number.isFinite(stationLatitude) ||
    !Number.isFinite(stationLongitude)
  ) {
    throw new Error("Radar volume is missing station coordinates");
  }

  const stationCoordinates: [number, number] = [
    stationLongitude,
    stationLatitude,
  ];

  return { azimuths, reflectivity, stationCoordinates };
}
