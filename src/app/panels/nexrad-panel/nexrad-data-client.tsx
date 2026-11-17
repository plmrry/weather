"use client";

import React from "react";
import type { fetchNexradData } from "./fetch-nexrad";

export function NexradDataClient({
  data: dataPromise,
}: {
  data: ReturnType<typeof fetchNexradData>;
}): null | React.JSX.Element {
  console.log("[NexradDataClient] Rendering with dataPromise:", dataPromise);
  const data = React.use(dataPromise);
  if (!data) return null;

  return (
    <g role="img" shapeRendering="crispEdges">
      <title>NEXRAD reflectivity projected around the selected location.</title>
      {data.paths.map(({ d, fill }) => (
        <path d={d} fill={fill} key={fill} />
      ))}
    </g>
  );
}
