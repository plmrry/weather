import React from "react";
import { MapLayer } from "../map-overlay";
import { Panel } from "../panel";
import { fetchNexradData } from "./fetch-nexrad";
import { NexradDataClient } from "./nexrad-data-client";

export function NexradDataPanel({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}): React.JSX.Element {
  const data = fetchNexradData(params);

  return (
    <Panel aria-label="NEXRAD Data" title="NEXRAD Data">
      <React.Suspense>
        {/* {params ? <MapLayer params={params} /> : null} */}
        {params ? <NexradDataClient data={data} /> : null}
      </React.Suspense>
    </Panel>
  );
}
