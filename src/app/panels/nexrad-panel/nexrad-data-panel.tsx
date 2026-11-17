import React from "react";
import { Panel } from "../panel";
import { fetchNexradListing } from "./fetch-nexrad";
import { NexradListingDynamic } from "./nexrad-listing-dynamic";

export function NexradDataPanel(): React.JSX.Element {
  const listing = fetchNexradListing();

  return (
    <Panel aria-label="NEXRAD Data" title="NEXRAD Data">
      <React.Suspense fallback={<p role="status">Loading NEXRAD data…</p>}>
        <NexradListingDynamic listing={listing} />
      </React.Suspense>
    </Panel>
  );
}
