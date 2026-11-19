import React from "react";
import { ErrorBoundary } from "#/app/error-boundary";
import { LoadingSpinner } from "#/app/loading-spinner";
import { fetchNexradDataOneHour } from "./fetch-nexrad";

export function NexradLayerAnimated({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  const data = params ? fetchNexradDataOneHour(params) : null;

  if (!data) return null;

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayerAnimated">
      <ErrorBoundary>
        <NexradLayerAnimatedRendered data={data} />
      </ErrorBoundary>
    </React.Suspense>
  );
}

function NexradLayerAnimatedRendered({
  data: dataPromise,
}: {
  data?: ReturnType<fetchNexradDataOneHour>;
}): null | React.JSX.Element {
  const frames = dataPromise ? React.use(dataPromise) : null;
  const first = frames?.at(0);
  if (!frames || !first) return null;

  const keyTimes = Array.from(
    { length: frames.length + 1 },
    (_, index) => index / frames.length,
  ).join(";");

  return (
    <svg
      className="absolute inset-0 size-full"
      data-frames={frames.length}
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${first.mapSize} ${first.mapSize}`}
    >
      <title>
        NEXRAD reflectivity over the past hour around the selected location.
      </title>
      {first.paths.map(({ fill, gridPath: d, reflectivity }, pathIndex) => (
        <path d={d} fill={fill} key={reflectivity}>
          {frames.length > 1 ? (
            <animate
              attributeName="d"
              calcMode="discrete"
              dur={`${frames.length * 0.5}s`}
              keyTimes={keyTimes}
              repeatCount="indefinite"
              values={[
                ...frames.map(
                  (frame) => frame.paths[pathIndex]?.gridPath ?? "M0,0",
                ),
                d,
              ].join(";")}
            />
          ) : null}
        </path>
      ))}
    </svg>
  );
}
