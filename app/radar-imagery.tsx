"use client"

import { useMemo } from "react"
import { Clock, Image as ImageIcon, Layers, Map as MapIcon, Radio, Satellite } from "lucide-react"
import { RelativeTime } from "./relative-time"
import { BaseMap } from "./base-map"

/** Relative "updated N min ago" stamp shown above each image, computed with Temporal. */
function Stamp({ iso }: { iso: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5 shrink-0" />
      <span>
        Updated <RelativeTime iso={iso} className="text-foreground" />
      </span>
    </div>
  )
}

export type RadarImagery = {
  ridge: { latestUrl: string; loopUrl: string }
  iem: { reflectivityUrl: string; bbox: number[] }
  rainviewer: {
    host: string
    tileSize: number
    zoom: number
    color: number
    options: string
    center: { x: number; y: number }
    basemapTemplate: string
    frames: { time: number; path: string; kind: "past" | "nowcast" }[]
  } | null
}

function bust(url: string, token: string) {
  return `${url}${url.includes("?") ? "&" : "?"}_=${encodeURIComponent(token)}`
}

function fmtClock(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

/** Wraps each source in a titled block so the stack reads clearly. */
function SourceBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-accent" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/** NWS RIDGE — government per-station imagery: latest still. */
function RidgeView({ imagery, token }: { imagery: RadarImagery; token: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Stamp iso={token} />
      <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={token}
          src={bust(imagery.ridge.latestUrl, token) || "/placeholder.svg"}
          alt="NWS RIDGE base reflectivity latest frame"
          className="h-auto w-full"
          loading="lazy"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Base reflectivity rendered by the National Weather Service (RIDGE). Updates every volume scan (~4–6 min).
      </p>
    </div>
  )
}

/** RainViewer — most recent global mosaic frame composited over a basemap (static). */
function RainViewerView({ imagery }: { imagery: RadarImagery }) {
  const rv = imagery.rainviewer!
  const cells = useMemo(() => {
    const out: { dx: number; dy: number }[] = []
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) out.push({ dx, dy })
    return out
  }, [])

  // Only the last available "past" frame — the most recent real observation.
  const pastFrames = rv.frames.filter((f) => f.kind === "past")
  const frame = pastFrames[pastFrames.length - 1] ?? rv.frames[rv.frames.length - 1]
  if (!frame) return null

  const tileUrl = (dx: number, dy: number) =>
    `${rv.host}${frame.path}/${rv.tileSize}/${rv.zoom}/${rv.center.x + dx}/${rv.center.y + dy}/${rv.color}/${rv.options}.png`
  const baseUrl = (dx: number, dy: number) =>
    rv.basemapTemplate
      .replace("{z}", String(rv.zoom))
      .replace("{x}", String(rv.center.x + dx))
      .replace("{y}", String(rv.center.y + dy))

  return (
    <div className="flex flex-col gap-3">
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
      <p className="text-xs text-muted-foreground">
        Latest global mosaic frame from RainViewer over a CARTO basemap (~10 min cadence). Blue → red = increasing
        precipitation intensity.
      </p>
    </div>
  )
}

/** Iowa Environmental Mesonet — WMS base-reflectivity mosaic around the point. */
function IemView({ imagery, token }: { imagery: RadarImagery; token: string }) {
  return (
    <div className="flex flex-col gap-3">
      <Stamp iso={token} />
      <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={token}
          src={bust(imagery.iem.reflectivityUrl, token) || "/placeholder.svg"}
          alt="Iowa Environmental Mesonet NEXRAD base reflectivity mosaic around the location"
          className="h-auto w-full"
          loading="lazy"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        NEXRAD N0Q base-reflectivity mosaic served via the Iowa Environmental Mesonet WMS (~5 min cadence).
      </p>
    </div>
  )
}

export function RadarImageryPanel({
  imagery,
  retrievedAt,
}: {
  imagery: RadarImagery
  retrievedAt: string
}) {
  const sourceCount = 2 + (imagery.rainviewer ? 1 : 0)

  return (
    <section aria-labelledby="imagery-heading" className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-accent" />
          <h2 id="imagery-heading" className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Rendered radar imagery
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{sourceCount} sources</span>
      </div>

      <div className="flex flex-col gap-6 p-4">
        <SourceBlock icon={MapIcon} title="Reference map">
          <BaseMap
            bbox={imagery.iem.bbox as [number, number, number, number]}
            center={{
              lon: (imagery.iem.bbox[0] + imagery.iem.bbox[2]) / 2,
              lat: (imagery.iem.bbox[1] + imagery.iem.bbox[3]) / 2,
            }}
          />
        </SourceBlock>

        <SourceBlock icon={Radio} title="NWS RIDGE">
          <RidgeView imagery={imagery} token={retrievedAt} />
        </SourceBlock>

        {imagery.rainviewer && (
          <SourceBlock icon={Satellite} title="Live mosaic">
            <RainViewerView imagery={imagery} />
          </SourceBlock>
        )}

        <SourceBlock icon={Layers} title="Mesonet">
          <IemView imagery={imagery} token={retrievedAt} />
        </SourceBlock>
      </div>
    </section>
  )
}
