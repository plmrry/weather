"use client";

import React from "react";

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
  });
}

function parseTimestamp(timestamp: string | undefined): Date | null {
  const date = timestamp ? new Date(timestamp) : new Date();

  return Number.isNaN(date.getTime()) ? null : date;
}

export function LastUpdated({
  timestamp,
}: {
  timestamp?: string;
}): React.JSX.Element {
  const [date, setDate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setDate(parseTimestamp(timestamp));
  }, [timestamp]);

  if (!date) {
    return <span>—</span>;
  }

  return <time dateTime={date.toISOString()}>{formatTimestamp(date)}</time>;
}
