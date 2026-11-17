"use client";

import dynamic from "next/dynamic";

export const NexradListingDynamic = dynamic(
  () =>
    import("./nexrad-listing-client").then(
      (module) => module.NexradListingClient,
    ),
  { ssr: false },
);
