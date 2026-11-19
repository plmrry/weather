"use client";

import React from "react";
import type { NexradResponses } from "./types";

export function NexradLayerRendered({
  data: promise,
}: {
  data: Promise<NexradResponses["latest"]>;
}) {
  const data = React.use(promise);
  if (!data) return null;

  const layers = data.layers ?? [];

  if (layers.length === 0) return null;

  return (
    <>
      <title>NEXRAD reflectivity projected around the selected location.</title>
      <g
        data-layers={layers.length}
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
    </>
  );
}
