import React from "react";
import { getCoordinates } from "#/app/find-station/geocode";
import { LoadingSpinner } from "#/app/loading-spinner";
import { MapLayer } from "#/app/map-layer";
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
        <React.Suspense fallback={<LoadingSpinner />} name="MapLayer">
          <MapLayer params={params} />
        </React.Suspense>
        <NexradLayer params={params} />
      </MapPanel>
      <h1 className="w-full text-center text-2xl font-bold">Other Locations</h1>
      {newMaps.map(({ latitude, location, longitude }) => {
        const params = Promise.resolve({
          latitude: String(latitude),
          longitude: String(longitude),
        });
        return (
          <MapPanel key={location} params={params} title={location}>
            <React.Suspense fallback={<LoadingSpinner />} name="MapLayer">
              <MapLayer params={params} />
            </React.Suspense>
            <NexradLayer params={params} />
          </MapPanel>
        );
      })}
    </>
  );
}
