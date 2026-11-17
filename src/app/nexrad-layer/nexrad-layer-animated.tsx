import React from "react";
import * as d3 from "d3";
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
      <NexradLayerAnimatedRendered data={data} />
    </React.Suspense>
  );
}

const reflectivityColorScale = d3
  .scaleSequential(d3.interpolateTurbo)
  .domain([5, 50])
  .clamp(true);

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

  const data = frames.at(-1);

  const paths = data?.paths ?? [];

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
      {paths.map(({ d, reflectivity }) => {
        if (!d) return null;
        const fill = reflectivityColorScale(reflectivity);
        return <path d={d} fill={fill} key={reflectivity} />;
      })}
      {/* {frames.map((frame, frameIndex) => (
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
      ))} */}
    </svg>
  );
}
