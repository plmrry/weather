import React from "react";
import { Map as MapIcon } from "lucide-react";
import { getCoordinates } from "#/app/find-station/geocode";
import { MapLayer } from "#/app/map-layer/map-layer";
import { Panel } from "#/app/panel";
import { NexradLayer } from "./nexrad-layer/nexrad-layer";
import { NexradLayerAnimated } from "./nexrad-layer/nexrad-layer-animated";

const otherLocations = [
  "Austin, Texas",
  "Spokane, Washington",
  "Anchorage, Alaska",
  "Burlington, Vermont",
  "Manhattan, New York"
] as const;

export async function Panels({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}): Promise<React.JSX.Element> {
  return (
    <>
      <Panel icon={<MapIcon />} title="NEXRAD Data">
        <MapLayer params={params} />
        <NexradLayer params={params} />
      </Panel>
      <Panel icon={<MapIcon />} title="NEXRAD Data Animated">
        <MapLayer params={params} />
        {/* <NexradLayerAnimated params={params} /> */}
      </Panel>
      <h1 className="w-full text-center text-2xl font-bold">Other Locations</h1>
      {otherLocations.map((location) => {
        const params = getCoordinates(location);
        return (
          <Panel icon={<MapIcon />} key={location} title={location}>
            <MapLayer params={params} />
            {/* <NexradLayer params={params} /> */}
          </Panel>
        );
      })}
    </>
  );
}
