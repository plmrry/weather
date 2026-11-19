import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { MapSvg } from "#/app/map-svg";
import { fetchNexradData } from "./fetch-nexrad";

export function NexradFrame({
  offsetMinutes,
  params,
}: {
  offsetMinutes: number;
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const data = fetchNexradData({ offsetMinutes, params });

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradFrame">
      <NexradFrameRendered data={data} offsetMinutes={offsetMinutes} />
    </React.Suspense>
  );
}

function NexradFrameRendered({
  data: promise,
  offsetMinutes,
}: {
  data: ReturnType<fetchNexradData>;
  offsetMinutes: number;
}) {
  const data = React.use(promise);

  const layers = data?.layers ?? [];

  return (
    <MapSvg
      aria-label="NEXRAD reflectivity"
      data-layers={layers.length}
      data-nexrad-frame
      data-offset-minutes={offsetMinutes}
      data-timestamp={data?.timestamp}
      role="img"
    >
      <title>NEXRAD reflectivity projected around the selected location.</title>
      <g className="[shape-rendering:optimizeSpeed]" data-nexrad-frame-layers>
        {layers.map(({ contourPath, count, fill, reflectivity }) => (
          <g
            data-layer-count={count}
            data-layer-reflectivity={reflectivity}
            data-nexrad-frame-layer
            key={reflectivity}
          >
            <path d={contourPath} fill={fill} />
          </g>
        ))}
      </g>
    </MapSvg>
  );
}
