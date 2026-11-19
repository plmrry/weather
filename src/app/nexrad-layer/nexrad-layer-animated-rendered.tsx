"use client";

import React from "react";
import { MapSvg } from "#/app/map-svg";
import type { NexradResponses } from "./types";

export function NexradLayerAnimatedRendered({
  animationRef,
  data: promise,
}: {
  animationRef: React.RefObject<null | SVGGElement>;
  data: Promise<NexradResponses["hour"]>;
}) {
  const { frames, keyTimes } = React.use(promise);

  if (frames.length === 0) return null;

  return (
    <MapSvg
      aria-label="Animated NEXRAD reflectivity"
      data-map-layer="radar-animated"
      role="img"
    >
      <g
        data-frames={frames.length}
        ref={animationRef}
        style={{ shapeRendering: "optimizeSpeed" }}
      >
        <title>
          NEXRAD reflectivity over the past hour around the selected location.
        </title>
        {frames.map((frame, frameIndex) => (
          <g
            data-frame={frameIndex}
            key={frame.key}
            visibility={frameIndex === 0 ? "visible" : "hidden"}
          >
            <animate
              attributeName="visibility"
              calcMode="discrete"
              dur={`${frames.length * 0.5}s`}
              keyTimes={keyTimes}
              repeatCount="indefinite"
              values={frame.animateValues}
            />
            {frame.layers.map(({ contourPath, fill, reflectivity }) => (
              <g data-reflectivity-layer={reflectivity} key={reflectivity}>
                <path d={contourPath} fill={fill} />
              </g>
            ))}
          </g>
        ))}
      </g>
    </MapSvg>
  );
}

export function NexradLayerAnimatedTimestamp({
  animationRef,
  data: promise,
}: {
  animationRef: React.RefObject<null | SVGGElement>;
  data: Promise<NexradResponses["hour"]>;
}) {
  const { frames } = React.use(promise);
  const getFrameIndex = React.useCallback(() => {
    const elements =
      animationRef.current?.querySelectorAll<SVGGElement>("[data-frame]");
    for (const element of elements ?? []) {
      if (getComputedStyle(element).visibility === "visible") {
        return Number(element.dataset.frame);
      }
    }

    return 0;
  }, [animationRef]);
  const frameIndex = React.useSyncExternalStore(
    subscribeToAnimation,
    getFrameIndex,
    getInitialFrameIndex,
  );
  const frame = frames[frameIndex];
  if (!frame) return null;

  return (
    <time
      className="text-xs text-muted-foreground"
      data-timestamp={frame.timestamp}
      dateTime={frame.timestamp}
    >
      {new Date(frame.timestamp).toLocaleString("en-US", {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        second: "2-digit",
        timeZone: "America/New_York",
        timeZoneName: "short",
      })}
    </time>
  );
}

function subscribeToAnimation(onStoreChange: () => void) {
  let animationFrame: number;

  function tick() {
    onStoreChange();
    animationFrame = requestAnimationFrame(tick);
  }

  animationFrame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(animationFrame);
}

function getInitialFrameIndex() {
  return 0;
}
