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
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerRendered data={data} />
    </React.Suspense>
  );
}

function NexradLayerRendered({
  data: dataPromise,
}: {
  data?: ReturnType<fetchNexradDataLatest>;
}) {
  const data = dataPromise ? React.use(dataPromise) : null;
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
