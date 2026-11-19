import React from "react";
import { MapSvg } from "#/app/map-svg";
import { MAP_SIZE } from "#/app/map-projection";

export function LoadingSpinner(): React.JSX.Element {
  return (
    <MapSvg aria-label="Loading" role="status">
      <g transform={`translate(${MAP_SIZE / 2} ${MAP_SIZE / 2})`}>
        <circle
          aria-hidden="true"
          className="origin-center animate-spin transform-fill"
          fill="none"
          pathLength={100}
          r={16}
          stroke="white"
          strokeDasharray="75 25"
          strokeWidth={4}
        />
      </g>
    </MapSvg>
  );
}
