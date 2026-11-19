import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { fetchNexradDataLatest } from "./fetch-nexrad";
import { NexradLayerRendered } from "./nexrad-layer-rendered";

export function NexradLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const data = fetchNexradDataLatest(params);

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerRendered data={data} />
    </React.Suspense>
  );
}
