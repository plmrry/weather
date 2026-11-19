import React from "react";
import { MAP_SIZE } from "#/app/map-projection";

export function MapSvg({ children, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      {...props}
    >
      {children}
    </svg>
  );
}
