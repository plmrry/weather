import type Level2Radar from "nexrad-level-2-data";
import type { HighResData } from "nexrad-level-2-data";
import { destination } from "@turf/destination";
import * as d3 from "d3";
import {
  getSatelliteProjection,
  MAP_SIZE,
  reflectivityDomain,
  reflectivityQuantizeScale,
} from "#/app/map-projection";

export function parseRadarData({
  data,
  latitude,
  longitude,
}: {
  data: { azimuths: number[]; radar: Level2Radar; reflectivity: HighResData[] };
  latitude: number;
  longitude: number;
}) {
  if (data?.azimuths.length === 0) {
    throw new Error("Radar data contains no azimuths");
  }

  const points = radarDataToCoordinates({ radarData: data });

  const projection = getSatelliteProjection(
    Number(latitude),
    Number(longitude),
  );

  // const path = d3.geoPath(projection).digits(0).pointRadius(0.5);

  // const collator = new Intl.Collator(undefined, { numeric: true });

  // const reflectivities = [...pointsByReflectivity.keys()].toSorted((a, b) =>
  //   collator.compare(String(a), String(b)),
  // );

  // const paths = reflectivities.map((reflectivity) => {
  //   const points = (
  //     pointsByReflectivity.get(reflectivity) as [number, number][]
  //   )
  //     ?.toSorted((a, b) => collator.compare(String(a[0]), String(b[0])))
  //     .toSorted((a, b) => collator.compare(String(a[1]), String(b[1])));
  //   const multiPoint = {
  //     coordinates: points ?? [],
  //     type: "MultiPoint",
  //   };
  //   const pathData = path(multiPoint as any);
  //   return { count: points.length, d: pathData, reflectivity };
  // });

  return { mapSize: MAP_SIZE, paths: [] };
}

export function radarDataToCoordinates({
  radarData,
}: {
  radarData: {
    azimuths: number[];
    radar: Level2Radar;
    reflectivity: HighResData[];
  };
}) {
  const header = radarData?.radar?.getHeader(0);
  const stationLatitude = header?.volume?.latitude;
  const stationLongitude = header?.volume?.longitude;

  if (!stationLatitude || !stationLongitude) {
    throw new Error("Radar volume is missing station coordinates");
  }

  const stationCoordinates: [number, number] = [
    stationLongitude,
    stationLatitude,
  ];

  const first = radarData?.reflectivity[0];

  const gateSize = first?.gate_size ?? 0;
  const minDistance = first?.first_gate ?? 0;

  const points = [];

  for (const radial of Object.entries(radarData.reflectivity ?? [])) {
    const radialIndex = Number(radial[0]);
    const azimuthRaw = radarData.azimuths[radialIndex];
    if (!azimuthRaw) continue;
    const bearing = Math.round(azimuthRaw);
    const reflectivityData = radial[1];
    const moments = reflectivityData.moment_data ?? [];
    for (const moment of Object.entries(moments)) {
      const reflectivity = moment[1];
      if (!reflectivity) continue;

      const momentIndex = Number(moment[0]);

      const distanceRaw = minDistance + momentIndex * gateSize;

      const gateCoordinates = destination(
        {
          coordinates: stationCoordinates,
          type: "Point",
        },
        distanceRaw,
        bearing,
        { units: "kilometers" },
      ).geometry.coordinates;

      points.push({
        latitude: gateCoordinates[1],
        longitude: gateCoordinates[0],
        reflectivity,
      });
    }
  }

  return points;
}
