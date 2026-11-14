"use client";

import { type JSX, useEffect, useMemo, useState } from "react";
import { getMapBounds } from "./map-bounds";
import { RadarTimestamp } from "./radar-timestamp";

const FRAME_COUNT = 10;
const FRAME_INTERVAL_MINUTES = 5;
const PLAYBACK_MS = 500;

type Frame = {
  time: Date;
  url: string;
};

function buildFrames(latitude: number, longitude: number): Frame[] {
  const bbox = getMapBounds(latitude, longitude);
  const now = Date.now();
  const stepMs = FRAME_INTERVAL_MINUTES * 60 * 1000;
  const latest = Math.floor((now - stepMs) / stepMs) * stepMs;

  return Array.from({ length: FRAME_COUNT }, (_, index) => {
    const time = new Date(latest - (FRAME_COUNT - 1 - index) * stepMs);
    const searchParams = new URLSearchParams({
      BBOX: bbox.join(","),
      FORMAT: "image/png",
      HEIGHT: "600",
      LAYERS: "nexrad-n0q-wmst",
      REQUEST: "GetMap",
      SERVICE: "WMS",
      SRS: "EPSG:4326",
      TIME: time.toISOString().replace(/\.\d+Z$/, "Z"),
      TRANSPARENT: "true",
      VERSION: "1.1.1",
      WIDTH: "600",
    });

    return {
      time,
      url: `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q-t.cgi?${searchParams}`,
    };
  });
}

export function AnimatedRadar({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): JSX.Element {
  const frames = useMemo(
    () => buildFrames(latitude, longitude),
    [latitude, longitude],
  );
  const [activeFrame, setActiveFrame] = useState(0);

  useEffect(() => {
    setActiveFrame(0);
  }, [frames]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFrame((current) => (current + 1) % frames.length);
    }, PLAYBACK_MS);

    return () => clearInterval(interval);
  }, [frames.length]);

  return (
    <>
      {frames.map((frame, index) => (
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover transition-opacity duration-200"
          key={frame.url}
          src={frame.url || "/placeholder.svg"}
          style={{ opacity: index === activeFrame ? 1 : 0 }}
        />
      ))}
      <RadarTimestamp time={frames[activeFrame]?.time ?? null} />
    </>
  );
}
