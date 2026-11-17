import React from "react";
import { Map as MapIcon } from "lucide-react";
import { getCoordinates } from "#/app/find-station/geocode";
import { LoadingSpinner } from "#/app/loading-spinner";
import { MapLayer } from "#/app/map-layer/map-layer";
import { Panel } from "#/app/panel";
import { NexradLayer } from "./nexrad-layer/nexrad-layer";

const otherLocations = [
  "Austin, Texas",
  "Spokane, Washington",
  "Anchorage, Alaska",
  "Burlington, Vermont",
] as const;

export async function Panels({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}): Promise<React.JSX.Element> {
  return (
    <>
      <Panel
        aria-label="NEXRAD Data"
        icon={<MapIcon aria-hidden="true" className="size-3.5 text-white" />}
        title="NEXRAD Data"
      >
        <React.Suspense fallback={<LoadingSpinner />} name="MapLayer">
          <MapLayer params={params} />
        </React.Suspense>
        <NexradLayer params={params} />
      </Panel>
      <h1 className="w-full text-center text-2xl font-bold">Other Locations</h1>
      {otherLocations.map((location) => {
        const params = getCoordinates(location);
        return (
          <Panel
            aria-label={location}
            icon={
              <MapIcon aria-hidden="true" className="size-3.5 text-white" />
            }
            key={location}
            title={location}
          >
            <React.Suspense fallback={<LoadingSpinner />} name="MapLayer">
              <MapLayer params={params} />
            </React.Suspense>
            <NexradLayer params={params} />
          </Panel>
        );
      })}
    </>
  );
}
