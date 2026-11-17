import React from "react";
import { Map as MapIcon } from "lucide-react";
import { LoadingSpinner } from "#/app/loading-spinner";
import { MapLayer } from "#/app/map-layer";
import { Panel } from "#/app/panel";

export function MapPanel({
  children,
  title,
}: {
  children?: React.ReactNode;
  title: string;
}): React.JSX.Element {
  return (
    <Panel
      aria-label={title}
      icon={<MapIcon aria-hidden="true" className="size-3.5 text-white" />}
      title={title}
    >
      {children}
    </Panel>
  );
}
