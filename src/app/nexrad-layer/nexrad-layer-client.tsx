"use client";

import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import type { NexradResponses } from "./types";
import { NexradLayerRendered } from "./nexrad-layer-rendered";

export function NexradLayerClient({
  data,
}: {
  data: Promise<NexradResponses["latest"]>;
}) {
  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerRendered data={data} />
    </React.Suspense>
  );
}
