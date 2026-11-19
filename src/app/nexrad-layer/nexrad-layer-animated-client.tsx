"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "#/app/loading-spinner";
import type { RadarCoordinates } from "./types";
import { useNexradData } from "./use-nexrad-data";

const NexradLayerAnimatedRendered = dynamic(
  () =>
    import("./nexrad-layer-animated-rendered").then(
      (module) => module.NexradLayerAnimatedRendered,
    ),
  { loading: LoadingSpinner, ssr: false },
);

export function NexradLayerAnimatedClient({
  coordinates,
}: {
  coordinates: RadarCoordinates;
}) {
  const promise = useNexradData(coordinates, "hour");

  return <NexradLayerAnimatedRendered data={promise} />;
}
