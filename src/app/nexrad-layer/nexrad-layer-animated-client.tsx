"use client";

import React from "react";
import { Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "#/app/loading-spinner";
import { Panel } from "#/app/panel";
import type { NexradResponses } from "./types";

const NexradLayerAnimatedRendered = dynamic(
  () =>
    import("./nexrad-layer-animated-rendered").then(
      (module) => module.NexradLayerAnimatedRendered,
    ),
  { loading: LoadingSpinner, ssr: false },
);

const NexradLayerAnimatedTimestamp = dynamic(
  () =>
    import("./nexrad-layer-animated-rendered").then(
      (module) => module.NexradLayerAnimatedTimestamp,
    ),
  { ssr: false },
);

export function NexradLayerAnimatedClient({
  children,
  data,
}: {
  children?: React.ReactNode;
  data: Promise<NexradResponses["hour"]>;
}) {
  const animationRef = React.useRef<null | SVGGElement>(null);

  return (
    <Panel
      description={
        <NexradLayerAnimatedTimestamp animationRef={animationRef} data={data} />
      }
      icon={<MapIcon />}
      title="NEXRAD Data Animated"
    >
      {children}
      <NexradLayerAnimatedRendered animationRef={animationRef} data={data} />
    </Panel>
  );
}
