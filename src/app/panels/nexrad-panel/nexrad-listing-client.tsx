"use client";

import React from "react";

export function NexradListingClient({
  listing,
}: {
  listing: Promise<string[]>;
}): React.JSX.Element {
  const keys = React.use(listing);

  return (
    <ul className="absolute inset-0 overflow-auto p-4 font-mono text-xs break-all">
      {keys.map((key) => (
        <li key={key}>{key}</li>
      ))}
    </ul>
  );
}
