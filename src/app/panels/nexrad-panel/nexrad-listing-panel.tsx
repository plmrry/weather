import React from "react";
import { Panel } from "../panel";
import { fetchNexradListing } from "./fetch-nexrad";
import { NexradListingDynamic } from "./nexrad-listing-dynamic";

export function NexradListingPanel(): React.JSX.Element {
  const listing = fetchNexradListing();

  return (
    <Panel aria-label="NEXRAD Listing" title="NEXRAD Listing">
      <React.Suspense fallback={<p role="status">Loading NEXRAD listing…</p>}>
        <NexradListingDynamic listing={listing} />
      </React.Suspense>
    </Panel>
  );
}
