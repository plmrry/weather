"use client";

import type { JSX } from "react";
import { useMemo } from "react";

import { fmtClock, MoreInfo, InfoList, Stamp, type RadarImagery } from "./shared";

/** RainViewer — most recent global mosaic frame composited over a basemap (static). */
export function RainViewerPanel({ imagery }: { imagery: RadarImagery }): JSX.Element {
  const rv = imagery.rainviewer!;
  const cells = useMemo(() => {
    const out: { dx: number; dy: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) out.push({ dx, dy });
    return out;
  }, []);

  // Only the last available "past" frame — the most recent real observation.
  const pastFrames = rv.frames.filter((f) => f.kind === "past");
  const frame = pastFrames[pastFrames.length - 1] ?? rv.frames[rv.frames.length - 1];
  if (!frame) return <></>;

  const tileUrl = (dx: number, dy: number) =>
    `${rv.host}${frame.path}/${rv.tileSize}/${rv.zoom}/${rv.center.x + dx}/${rv.center.y + dy}/${rv.color}/${rv.options}.png`;
  const baseUrl = (dx: number, dy: number) =>
    rv.basemapTemplate
      .replace("{z}", String(rv.zoom))
      .replace("{x}", String(rv.center.x + dx))
      .replace("{y}", String(rv.center.y + dy));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Latest global mosaic frame from RainViewer over a CARTO basemap (~10 min cadence). Blue →
        red = increasing precipitation intensity.
      </p>
      <MoreInfo>
        <InfoList
          items={[
            {
              label: "Provider",
              value: "RainViewer — global composite of national radar networks",
            },
            { label: "Tiles", value: `256px Web Mercator XYZ tiles, zoom ${rv.zoom}` },
            { label: "Basemap", value: "CARTO dark tiles, composited under the radar layer" },
            {
              label: "Cadence",
              value:
                "~10 min for observed frames; nowcast frames are short-range extrapolations, not observations.",
            },
            {
              label: "Source",
              value: (
                <a
                  href="https://www.rainviewer.com/api.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline decoration-dotted underline-offset-4"
                >
                  RainViewer API →
                </a>
              ),
            },
          ]}
        />
      </MoreInfo>
      <Stamp iso={new Date(frame.time * 1000).toISOString()} />
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-md border border-border bg-[#0b0f14]">
        <div className="grid grid-cols-3 grid-rows-3">
          {cells.map(({ dx, dy }) => (
            <div key={`${dx}:${dy}`} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={baseUrl(dx, dy) || "/placeholder.svg"}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                loading="lazy"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tileUrl(dx, dy) || "/placeholder.svg"}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full opacity-85 mix-blend-screen"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        {/* Point marker at grid center */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="block size-3 rounded-full border-2 border-background bg-primary shadow" />
        </div>
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-background/80 px-2 py-1 font-mono text-[0.65rem] text-foreground backdrop-blur">
          {fmtClock(frame.time)}
        </div>
      </div>
    </div>
  );
}
