import React from "react";
import { Map as MapIcon } from "lucide-react";
import { getCoordinates } from "#/app/find-station/geocode";
import { MapLayers } from "#/app/map-layer/map-layers";
import { Panel } from "#/app/panel";
import { NexradFrame } from "./nexrad-layer/nexrad-layer";
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
        mapLayers={<MapLayers params={params} />}
        radarFrames={[
          <NexradFrame key={0} offsetMinutes={0} params={params} />,
        ]}
        radarTimestamps={[
          <NexradTimestamp key={0} offsetMinutes={0} params={params} />,
        ]}
        title="NEXRAD Data"
      />
      <Panel
        icon={<MapIcon />}
        mapLayers={<MapLayers params={params} />}
        radarFrames={[
          <NexradFrame key={0} offsetMinutes={0} params={params} />,
          // <NexradFrame key={15} offsetMinutes={15} params={params} />,
          // <NexradFrame key={30} offsetMinutes={30} params={params} />,
          // <NexradFrame key={45} offsetMinutes={45} params={params} />,
          // <NexradFrame key={60} offsetMinutes={60} params={params} />,
          // <NexradFrame key={75} offsetMinutes={75} params={params} />,
        ]}
        radarTimestamps={[
          <NexradTimestamp key={0} offsetMinutes={0} params={params} />,
        ]}
        title="NEXRAD Data Animated"
      />
      <h1 className="w-full text-center text-2xl font-bold">Other Locations</h1>
      {otherLocations.map((location) => {
        const params = getCoordinates(location);
        return (
          <Panel
            icon={<MapIcon />}
            key={location}
            mapLayers={<MapLayers params={params} />}
            radarFrames={[
              <NexradFrame key={0} offsetMinutes={0} params={params} />,
            ]}
            radarTimestamps={[
              <NexradTimestamp key={0} offsetMinutes={0} params={params} />,
            ]}
            title={location}
          />
        );
      })}
    </>
  );
}
