import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { NexradLayerClient } from "./nexrad-layer-client";

export function NexradLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayer">
      <NexradLayerResolved params={params} />
    </React.Suspense>
  );
}

async function NexradLayerResolved({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  const coordinates = await params;
  if (!coordinates) return null;

  return <NexradLayerClient coordinates={coordinates} />;
}
