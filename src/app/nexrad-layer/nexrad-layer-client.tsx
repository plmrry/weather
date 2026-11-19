"use client";

import React from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "#/app/loading-spinner";
import type { RadarCoordinates } from "./types";
import { useNexradData } from "./use-nexrad-data";

const NexradLayerRendered = dynamic(
  () =>
    import("./nexrad-layer-rendered").then(
      (module) => module.NexradLayerRendered,
    ),
  { loading: LoadingSpinner, ssr: false },
);

export function NexradLayerClient({
  coordinates,
}: {
  coordinates: RadarCoordinates;
}) {
  const promise = useNexradData(coordinates, "latest");

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayerClient">
      <NexradLayerRendered data={promise} />
    </React.Suspense>
  );
}
