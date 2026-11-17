import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { fetchNexradDataLatest } from "./fetch-nexrad";

export function NexradLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  const data = params ? fetchNexradDataLatest(params) : null;

  if (!data) return null;

  return (
    <React.ViewTransition>
      <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
        <NexradLayerRendered data={data} />
      </React.Suspense>
    </React.ViewTransition>
  );
}

function NexradLayerRendered({
  data: dataPromise,
}: {
  data?: ReturnType<fetchNexradDataLatest>;
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
