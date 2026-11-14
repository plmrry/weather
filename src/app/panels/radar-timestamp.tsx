"use client";

import { type JSX, useEffect, useState } from "react";

function formatTimestamp(date: Date): string {
  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

export function RadarTimestamp({
  time,
}: {
  time: Date | null;
}): JSX.Element | null {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !time) {
    return null;
  }

  return (
    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white/90 tabular-nums">
      {formatTimestamp(time)}
    </span>
  );
}
