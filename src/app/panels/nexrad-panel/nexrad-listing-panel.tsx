import React from "react";
import { Panel } from "../panel";
import { fetchNexradListing } from "./fetch-nexrad-listing";
import { NexradListingDynamic } from "./nexrad-listing-dynamic";

export function NexradListingPanel({
  params,
}: {
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}): React.JSX.Element {
  const listing = fetchNexradListing(params);

  return (
    <Panel aria-label="NEXRAD Listing" title="NEXRAD Listing">
      <React.Suspense fallback={<p role="status">Loading NEXRAD listing…</p>}>
        <NexradListingDynamic listing={listing} />
      </React.Suspense>
    </Panel>
  );
}
