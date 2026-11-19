import React from "react";
import { Map as MapIcon } from "lucide-react";
import { getCoordinates } from "#/app/find-station/geocode";
import { MapLayer } from "#/app/map-layer/map-layer";
import { Panel } from "#/app/panel";
import { NexradLayer } from "./nexrad-layer/nexrad-layer";
import { NexradTimestamp } from "./nexrad-layer/nexrad-timestamp";

const otherLocations = [
  "Anchorage, Alaska",
  "Austin, Texas",
  "Burlington, Vermont",
  "Manhattan, New York",
  "Spokane, Washington",
  "Tampa, Florida",
] as const;

export async function Panels({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}): Promise<React.JSX.Element> {
  return (
    <>
      <Panel
        icon={<MapIcon />}
        timestamp={
          <React.Suspense name="NexradTimestamp">
            <NexradTimestamp offset={1} params={params} />
          </React.Suspense>
        }
        title="NEXRAD Data"
      >
        <MapLayer params={params} />
        <NexradLayer offset={1} params={params} />
      </Panel>
      <Panel icon={<MapIcon />} title="NEXRAD Data Animated">
        <MapLayer params={params} />
      </Panel>
      <h1 className="w-full text-center text-2xl font-bold">Other Locations</h1>
      {otherLocations.map((location) => {
        const params = getCoordinates(location);
        return (
          <Panel
            icon={<MapIcon />}
            key={location}
            timestamp={
              <React.Suspense name="NexradTimestamp">
                <NexradTimestamp offset={1} params={params} />
              </React.Suspense>
            }
            title={location}
          >
            <MapLayer params={params} />
            <NexradLayer offset={1} params={params} />
          </Panel>
        );
      })}
    </>
  );
}
