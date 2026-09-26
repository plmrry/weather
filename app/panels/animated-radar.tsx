"use client";

import { type JSX, useEffect, useMemo, useState } from "react";

const FRAME_COUNT = 10;
const FRAME_INTERVAL_MINUTES = 5;
const PLAYBACK_MS = 500;

function buildFrameUrls(latitude: number, longitude: number): string[] {
  const bbox = [longitude - 2, latitude - 2, longitude + 2, latitude + 2];
  const now = Date.now();
  const stepMs = FRAME_INTERVAL_MINUTES * 60 * 1000;
  const latest = Math.floor((now - stepMs) / stepMs) * stepMs;

  return Array.from({ length: FRAME_COUNT }, (_, index) => {
    const timestamp = new Date(latest - (FRAME_COUNT - 1 - index) * stepMs);
    const searchParams = new URLSearchParams({
      BBOX: bbox.join(","),
      FORMAT: "image/png",
      HEIGHT: "600",
      LAYERS: "nexrad-n0q-wmst",
      REQUEST: "GetMap",
      SERVICE: "WMS",
      SRS: "EPSG:4326",
      TIME: timestamp.toISOString().replace(/\.\d+Z$/, "Z"),
      TRANSPARENT: "true",
      VERSION: "1.1.1",
      WIDTH: "600",
    });

    return `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q-t.cgi?${searchParams}`;
  });
}

export function AnimatedRadar({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}): JSX.Element {
  const frames = useMemo(() => buildFrameUrls(latitude, longitude), [latitude, longitude]);
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
      {frames.map((src, index) => (
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover transition-opacity duration-200"
          key={src}
          src={src || "/placeholder.svg"}
          style={{ opacity: index === activeFrame ? 1 : 0 }}
        />
      ))}
    </>
  );
}
