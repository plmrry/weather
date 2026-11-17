import React from "react";
import { getCoordinates } from "#/app/find-station/geocode";
import { MapPanel } from "#/app/map-panel";
import { NexradLayer } from "./nexrad-panel/nexrad-layer";

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
  const newMaps = await Promise.all(
    otherLocations.map(async (location) => {
      const coordinates = await getCoordinates(location);
      return {
        latitude: coordinates.latitude,
        location,
        longitude: coordinates.longitude,
      };
    }),
  );
  return (
    <>
      <MapPanel params={params} title="NEXRAD Data">
        <NexradLayer params={params} />
      </MapPanel>
      <h1 className="text-2xl font-bold text-center w-full">Other Locations</h1>
      {newMaps.map(({ latitude, location, longitude }) => {
        const params = Promise.resolve({
          latitude: String(latitude),
          longitude: String(longitude),
        });
        return (
          <MapPanel key={location} params={params} title={location}>
            <NexradLayer params={params} />
          </MapPanel>
        );
      })}
    </>
  );
}
