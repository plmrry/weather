import React from "react";
import { Panel } from "../panel";
import { fetchNexradData } from "./fetch-nexrad";
import { NexradDataClient } from "./nexrad-data-client";

export function NexradDataPanel(): React.JSX.Element {
  const data = fetchNexradData();

  return (
    <Panel aria-label="NEXRAD Data" title="NEXRAD Data">
      <React.Suspense fallback={<p role="status">Loading NEXRAD data…</p>}>
        <NexradDataClient data={data} />
      </React.Suspense>
    </Panel>
  );
}
