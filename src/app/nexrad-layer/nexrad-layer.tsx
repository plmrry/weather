import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { MapSvg } from "#/app/map-svg";
import { fetchNexradData } from "./fetch-nexrad";

export function NexradLayer({
  offset,
  params,
}: {
  offset: number;
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const data = fetchNexradData({ offset, params });

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerRendered data={data} offset={offset} />
    </React.Suspense>
  );
}

export function NexradLayerRendered({
  data: promise,
  offset,
}: {
  data: ReturnType<fetchNexradData>;
  offset: number;
}) {
  const data = React.use(promise);

  const layers = data?.layers ?? [];

  return (
    <MapSvg
      aria-label="NEXRAD reflectivity"
      data-map-layer="radar"
      data-offset={offset}
      role="img"
    >
      <title>NEXRAD reflectivity projected around the selected location.</title>
      <g
        data-layers={layers.length}
        data-timestamp={data?.timestamp}
        style={{ shapeRendering: "optimizeSpeed" }}
      >
        {layers.map(({ contourPath, count, fill, reflectivity }) => (
          <g
            data-count={count}
            data-reflectivity={reflectivity}
            key={reflectivity}
          >
            <path d={contourPath} fill={fill} />
          </g>
        ))}
      </g>
    </MapSvg>
  );
}
