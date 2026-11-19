import React from "react";
import { MAP_SIZE } from "#/app/map-projection";

export function MapSvg({
  children,
  className = "",
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      className={`pointer-events-none size-full [grid-area:1/1] ${className}`}
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      {...props}
    >
      {children}
    </svg>
  );
}
