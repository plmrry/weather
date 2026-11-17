import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { fetchNexradData } from "./fetch-nexrad";
import { NexradLayerRendered } from "./nexrad-layer-rendered";

export function NexradLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  const data = params ? fetchNexradData(params) : null;

  if (!data) return null;

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerRendered data={data} />
    </React.Suspense>
  );
}
