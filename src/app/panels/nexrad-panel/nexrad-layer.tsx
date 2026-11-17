import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { fetchNexradData } from "./fetch-nexrad";
import { NexradLayerRendered } from "./nexrad-layer-rendered";

export function NexradLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}): React.JSX.Element {
  const data = fetchNexradData(params);

  return (
    <React.Suspense fallback={<LoadingSpinner />}>
      <NexradLayerRendered data={data} />
    </React.Suspense>
  );
}
