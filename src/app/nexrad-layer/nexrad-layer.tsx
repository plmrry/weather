import React from "react";
import * as d3 from "d3";
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

  const paths = data.paths ?? [];

  if (paths.length === 0) return null;

  const reflectivityExtent = d3.extent(
    paths,
    ({ reflectivity }) => reflectivity,
  );

  return (
    <svg
      className="absolute inset-0 size-full"
      data-extent={reflectivityExtent}
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${data.mapSize} ${data.mapSize}`}
    >
      <title>NEXRAD reflectivity projected around the selected location.</title>
      <g data-layers={paths.length}>
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
    </svg>
  );
}
