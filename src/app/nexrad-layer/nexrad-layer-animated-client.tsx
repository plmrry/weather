"use client";

import React from "react";
import { Map as MapIcon } from "lucide-react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { Panel } from "#/app/panel";
import type { NexradResponses } from "./types";
import {
  NexradLayerAnimatedRendered,
  NexradLayerAnimatedTimestamp,
} from "./nexrad-layer-animated-rendered";

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
      icon={<MapIcon />}
      timestamp={
        <React.Suspense name="NexradLayerAnimatedTimestamp">
          <NexradLayerAnimatedTimestamp
            animationRef={animationRef}
            data={data}
          />
        </React.Suspense>
      }
      title="NEXRAD Data Animated"
    >
      {children}
      <React.Suspense fallback={<LoadingSpinner />} name="NexradLayerAnimated">
        <NexradLayerAnimatedRendered animationRef={animationRef} data={data} />
      </React.Suspense>
    </Panel>
  );
}
