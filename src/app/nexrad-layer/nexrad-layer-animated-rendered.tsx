"use client";

import React from "react";
import type { NexradResponses } from "./types";

export function NexradLayerAnimatedRendered({
  data: promise,
}: {
  data: Promise<NexradResponses["hour"]>;
}) {
  const frames = React.use(promise);

  if (frames.length === 0) return null;

  const keyTimes = Array.from({ length: frames.length + 1 }, (_, index) =>
    (index / frames.length).toFixed(1),
  ).join(";");

  return (
    <g data-frames={frames.length} style={{ shapeRendering: "optimizeSpeed" }}>
      <title>
        NEXRAD reflectivity over the past hour around the selected location.
      </title>
      {frames.map((frame, frameIndex) => (
        <g
          data-frame={frameIndex}
          key={frame.key}
          opacity={frameIndex === 0 ? 1 : 0}
        >
          <animate
            attributeName="opacity"
            calcMode="discrete"
            dur={`${frames.length * 0.5}s`}
            keyTimes={keyTimes}
            repeatCount="indefinite"
            values={[
              ...frames.map((_, index) => (index === frameIndex ? 1 : 0)),
              frameIndex === 0 ? 1 : 0,
            ].join(";")}
          />
          {frame.layers.map(({ contourPath, fill, reflectivity }) => (
            <g data-reflectivity-layer={reflectivity} key={reflectivity}>
              <path d={contourPath} fill={fill} />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}
