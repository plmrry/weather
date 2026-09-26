"use client";

import { useEffect, useRef, useState, type JSX } from "react";

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

function formatRelative(from: number, now: number): string {
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "always" });
  let duration = Math.min(from - now, 0) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(-Math.max(Math.round(-duration), 0) || -0, division.unit);
    }
    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), "year");
}

export function LastUpdated(): JSX.Element {
  const mountedAt = useRef<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    mountedAt.current = Date.now();
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  if (mountedAt.current === null || now === null) {
    return <time>just now</time>;
  }

  const iso = new Date(mountedAt.current).toISOString();

  return (
    <time dateTime={iso} title={new Date(mountedAt.current).toLocaleString()}>
      {formatRelative(mountedAt.current, now)}
    </time>
  );
}
