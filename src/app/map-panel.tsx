import React from "react";
import { Map as MapIcon } from "lucide-react";
import { LastUpdated } from "#/app/last-updated";
import { LoadingSpinner } from "#/app/loading-spinner";
import { MapLayer } from "#/app/map-layer";
import { Panel } from "#/app/panel";

export function MapPanel({
  children,
  params,
  title,
}: {
  children?: React.ReactNode;
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
  title: string;
}): React.JSX.Element {
  return (
    <Panel
      aria-label={title}
      description={
        <p className="text-[0.625rem] text-muted-foreground">
          Updated <LastUpdated />
        </p>
      }
      icon={<MapIcon aria-hidden="true" className="size-3.5 text-white" />}
      title={title}
    >
      <React.Suspense fallback={<LoadingSpinner />} name="MapLayer">
        <MapLayer params={params} />
      </React.Suspense>
      {children}
    </Panel>
  );
}
