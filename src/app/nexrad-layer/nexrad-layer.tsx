import { fetchNexradDataLatest } from "./fetch-nexrad";
import { NexradLayerClient } from "./nexrad-layer-client";

export function NexradLayer({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const data = fetchNexradDataLatest(params)

  return <NexradLayerClient data={data} />;
}
