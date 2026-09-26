"use client";

import { type JSX, useEffect, useState } from "react";

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
  });
}

export function LastUpdated({ timestamp }: { timestamp: string }): JSX.Element {
  const [formatted, setFormatted] = useState(timestamp);

  useEffect(() => {
    setFormatted(formatTimestamp(timestamp));
  }, [timestamp]);

  return <time dateTime={timestamp}>{formatted}</time>;
}
