import React from "react";
import { MAP_SIZE } from "#/app/map-projection";

export function LoadingSpinner(): React.JSX.Element {
  return (
    <g
      aria-label="Loading"
      role="status"
      transform={`translate(${MAP_SIZE / 2} ${MAP_SIZE / 2})`}
    >
      <circle
        aria-hidden="true"
        fill="none"
        pathLength={100}
        r={16}
        stroke="white"
        strokeDasharray="75 25"
        strokeWidth={4}
      >
        <animateTransform
          attributeName="transform"
          dur="1s"
          from="0"
          repeatCount="indefinite"
          to="360"
          type="rotate"
        />
      </circle>
    </g>
  );
}
