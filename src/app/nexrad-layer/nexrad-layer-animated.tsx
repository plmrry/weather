import React from "react";
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
    <React.ViewTransition>
      <React.Suspense fallback={<LoadingSpinner />} name="NexradLayerAnimated">
        <NexradLayerAnimatedRendered data={data} />
      </React.Suspense>
    </React.ViewTransition>
  );
}

function NexradLayerAnimatedRendered({
  data: dataPromise,
}: {
  data?: ReturnType<fetchNexradDataOneHour>;
}): null | React.JSX.Element {
  const frames = dataPromise ? React.use(dataPromise) : null;
  const latest = frames?.at(-1);
  if (!frames || !latest) return null;

  const keyTimes = Array.from(
    { length: frames.length + 1 },
    (_, index) => index / frames.length,
  ).join(";");

  return (
    <svg
      className="absolute inset-0 size-full"
      role="img"
      shapeRendering="crispEdges"
      viewBox={`0 0 ${latest.mapSize} ${latest.mapSize}`}
    >
      <title>
        NEXRAD reflectivity over the past hour around the selected location.
      </title>
      {frames.map((frame, frameIndex) => (
        <g key={frameIndex} visibility="hidden">
          <animate
            attributeName="visibility"
            calcMode="linear"
            dur={`${frames.length * 0.5}s`}
            keyTimes={keyTimes}
            repeatCount="indefinite"
            values={Array.from({ length: frames.length + 1 }, (_, index) =>
              index % frames.length === frameIndex ? "visible" : "hidden",
            ).join(";")}
          />
          {frame.paths.map(({ d, fill }) => (
            <path d={d} fill={fill} key={fill} />
          ))}
        </g>
      ))}
    </svg>
  );
}
