import Level2Radar from "nexrad-level-2-data";
import { MAP_SIZE, reflectivityColorScale } from "#/app/map-projection";
import { parseRadarData } from "./parse-radar-data";

export function processRadarData(
  bytes: Uint8Array,
  mapCoordinates: [number, number],
) {
  const { azimuths, reflectivity, stationCoordinates, timestamp } =
    getRadarData(bytes);
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

  return { layers, mapSize: MAP_SIZE, timestamp };
}

function getRadarData(bytes: Uint8Array) {
  const radar = new Level2Radar(new Uint8Array(bytes));
  const { milliseconds, modified_julian_date: day } = radar.header;

  if (
    typeof day !== "number" ||
    !Number.isInteger(day) ||
    day < 1 ||
    typeof milliseconds !== "number" ||
    !Number.isInteger(milliseconds) ||
    milliseconds < 0 ||
    milliseconds >= 86_401_000
  ) {
    throw new Error("Radar archive is missing a valid timestamp");
  }

  const timestamp = new Date(
    (day - 1) * 86_400_000 + milliseconds,
  ).toISOString();

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

  return { azimuths, reflectivity, stationCoordinates, timestamp };
}
