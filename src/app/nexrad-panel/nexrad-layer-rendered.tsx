import React from "react";
import type { fetchNexradData } from "./fetch-nexrad";

export function NexradLayerRendered({
  data: dataPromise,
}: {
  data?: ReturnType<typeof fetchNexradData>;
}): null | React.JSX.Element {
  const data = dataPromise ? React.use(dataPromise) : null;
  if (!data) return null;

  return (
    <svg
      className="absolute inset-0 size-full"
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${data.mapSize} ${data.mapSize}`}
    >
      <title>NEXRAD reflectivity projected around the selected location.</title>
      {data.paths.map(({ d, fill }) => (
        <path d={d} fill={fill} key={fill} />
      ))}
    </svg>
  );
}
