import { MapLayer } from "#/app/map-layer/map-layer";
import { fetchNexradDataOneHour } from "./fetch-nexrad";
import { NexradLayerAnimatedClient } from "./nexrad-layer-animated-client";

export function NexradLayerAnimated({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  return (
    <NexradLayerAnimatedClient data={fetchNexradDataOneHour(params)}>
      <MapLayer params={params} />
    </NexradLayerAnimatedClient>
  );
}
