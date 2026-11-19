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
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayerAnimated">
      <NexradLayerAnimatedRendered data={data} />
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
            calcMode="linear"
            dur={`${frames.length * 0.5}s`}
            keyTimes={keyTimes}
            repeatCount="indefinite"
            values={[
              ...frames.map((_, index) => (index === frameIndex ? 1 : 0)),
              frameIndex === 0 ? 1 : 0,
            ].join(";")}
          />
          {frame.layers.map(({ contourPath, fill, reflectivity }) => (
            <g data-reflectivity-layer={reflectivity}>
              <path d={contourPath} fill={fill} key={reflectivity} />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}
