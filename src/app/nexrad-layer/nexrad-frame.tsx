import React from "react";
import { cacheLife, cacheTag, io } from "next/cache";
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

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradFrame">
      <NexradFrameRendered offsetMinutes={offsetMinutes} params={params} />
    </React.Suspense>
  );
}

async function NexradFrameRendered({
  offsetMinutes,
  params,
}: {
  offsetMinutes: number;
  params: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("nexrad-frame");

  await io();

  const nexradData = await fetchNexradData({ offsetMinutes, params });

  const layers = nexradData?.layers ?? [];

  return (
    <MapSvg
      aria-label="NEXRAD reflectivity"
      data-layers={layers.length}
      data-nexrad-frame
      data-offset-minutes={offsetMinutes}
      data-timestamp={nexradData?.timestamp}
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
