import React from "react";
import * as d3 from "d3";
import { ErrorBoundary } from "#/app/error-boundary";
import { LoadingSpinner } from "#/app/loading-spinner";
import { reflectivityColorScale } from "#/app/map-projection";
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
      <ErrorBoundary>
        <NexradLayerRendered data={data} />
      </ErrorBoundary>
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

  const paths = data.paths ?? [];

  if (paths.length === 0) return null;

  return (
    <>
      <title>NEXRAD reflectivity projected around the selected location.</title>
      <g
        data-layers={paths.length}
        style={{ opacity: 0.1, shapeRendering: "optimizeSpeed" }}
      >
        {paths.map(({ count, d, reflectivity }) => {
          if (!d) return null;
          const fill = reflectivityColorScale(reflectivity);
          return (
            <g
              data-count={count}
              data-reflectivity={reflectivity}
              key={reflectivity}
            >
              <path d={d} fill={fill} />
            </g>
          );
        })}
      </g>
      <g style={{ shapeRendering: "optimizeSpeed" }}>
        <path d={data.gridPath} fill="white" />
      </g>
    </>
  );
}
