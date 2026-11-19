import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { fetchNexradData } from "./fetch-nexrad";
import { NexradLayerRendered } from "./nexrad-layer-rendered";

export function NexradLayer({
  offset,
  params,
}: {
  offset: number;
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const data = fetchNexradData({ offset, params });

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerRendered data={data} />
    </React.Suspense>
  );
}
