"use client";
import React from "react";
import { RadarTimestamp } from "./radar-timestamp";

const FRAME_INTERVAL_MINUTES = 5;

function latestFrameTime(): Date {
  const stepMs = FRAME_INTERVAL_MINUTES * 60 * 1000;
  const now = Date.now();

  return new Date(Math.floor((now - stepMs) / stepMs) * stepMs);
}

export function CurrentRadarTimestamp(): React.JSX.Element {
  const [time, setTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setTime(latestFrameTime());
    const interval = setInterval(() => {
      setTime(latestFrameTime());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return <RadarTimestamp time={time} />;
}
