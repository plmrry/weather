"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "#/app/loading-spinner";
import type { NexradResponses } from "./types";

const NexradLayerRendered = dynamic(
  () =>
    import("./nexrad-layer-rendered").then(
      (module) => module.NexradLayerRendered,
    ),
  { loading: LoadingSpinner, ssr: false },
);

export function NexradLayerClient({
  data,
}: {
  data: Promise<NexradResponses["latest"]>;
}) {
  return <NexradLayerRendered data={data} />;
}
