import React from "react";
import { MapSvg } from "#/app/map-svg";
import type { NexradResponses } from "./types";

export function NexradLayerRendered({
  data: promise,
}: {
  data: Promise<NexradResponses["latest"]>;
}) {
  const data = React.use(promise);

  const layers = data?.layers ?? [];

  return (
    <MapSvg aria-label="NEXRAD reflectivity" data-map-layer="radar" role="img">
      <title>NEXRAD reflectivity projected around the selected location.</title>
      <g
        data-layers={layers.length}
        data-timestamp='timestamp'
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
