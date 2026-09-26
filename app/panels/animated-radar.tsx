"use client";

import { type JSX, useEffect, useMemo, useRef, useState } from "react";

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
      LAYERS: "nexrad-n0q",
      REQUEST: "GetMap",
      SERVICE: "WMS",
      SRS: "EPSG:4326",
      TIME: timestamp.toISOString().replace(/\.\d+Z$/, "Z"),
      TRANSPARENT: "true",
      VERSION: "1.1.1",
      WIDTH: "600",
    });

    return `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi?${searchParams}`;
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
  const loadedRef = useRef<Set<number>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadedRef.current = new Set();
    setReady(false);
    setActiveFrame(0);
  }, [frames]);

  useEffect(() => {
    if (!ready) return;

    const interval = setInterval(() => {
      setActiveFrame((current) => (current + 1) % frames.length);
    }, PLAYBACK_MS);

    return () => clearInterval(interval);
  }, [ready, frames.length]);

  return (
    <>
      {frames.map((src, index) => (
        <img
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover transition-opacity duration-200"
          key={src}
          src={src || "/placeholder.svg"}
          style={{ opacity: ready && index === activeFrame ? 1 : 0 }}
          onLoad={() => {
            loadedRef.current.add(index);
            if (loadedRef.current.size === frames.length) setReady(true);
          }}
          onError={() => {
            loadedRef.current.add(index);
            if (loadedRef.current.size === frames.length) setReady(true);
          }}
        />
      ))}
    </>
  );
}
