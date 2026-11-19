import React from "react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { NexradLayerAnimatedClient } from "./nexrad-layer-animated-client";

export function NexradLayerAnimated({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  return (
    <React.Suspense fallback={<LoadingSpinner />} name="NexradLayerAnimated">
      <NexradLayerAnimatedResolved params={params} />
    </React.Suspense>
  );
}

async function NexradLayerAnimatedResolved({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  const coordinates = await params;
  if (!coordinates) return null;

  return <NexradLayerAnimatedClient coordinates={coordinates} />;
}
