"use client";

import React from "react";

const relativeTime = new Intl.RelativeTimeFormat("en-US", {
  numeric: "always",
});

function subscribe(onStoreChange: () => void): () => void {
  const interval = setInterval(onStoreChange, 60_000);
  return () => clearInterval(interval);
}

function getSnapshot(): number {
  return Math.floor(Date.now() / 60_000);
}

function getServerSnapshot(): null {
  return null;
}

export function LastUpdated({
  timestamp,
}: {
  timestamp?: string;
}): React.JSX.Element {
  const currentMinute = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const date = timestamp ? new Date(timestamp) : null;

  if (!date || Number.isNaN(date.getTime()) || currentMinute === null) {
    return <span>—</span>;
  }

  const minutes = Math.floor(date.getTime() / 60_000) - currentMinute;

  return (
    <time dateTime={date.toISOString()}>
      {relativeTime.format(minutes || -0, "minute")}
    </time>
  );
}
