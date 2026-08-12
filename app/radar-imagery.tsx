"use client"

import { useMemo } from "react"
import { ChevronDown, Clock, Info, Map as MapIcon, Radio, Satellite } from "lucide-react"
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

/** Collapsible "more info" disclosure for a single source, using native <details> for a11y. */
function MoreInfo({ children }: { children: React.ReactNode }) {
  return (
    <details className="group rounded-md border border-border bg-secondary/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-1.5">
          <Info className="size-3.5 text-muted-foreground" />
          More info
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-border px-3 py-2.5">{children}</div>
    </details>
  )
}

/** Label/value definition list used inside MoreInfo blocks. */
function InfoList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs leading-relaxed">
      {items.map((item, i) => (
        <div className="contents" key={i}>
          <dt className="text-muted-foreground/70">{item.label}</dt>
          <dd className="text-foreground text-pretty">{item.value}</dd>
        </div>
      ))}
    </dl>
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
      <p className="text-xs text-muted-foreground">
        Base reflectivity rendered by the National Weather Service (RIDGE). Updates every volume scan (~4–6 min).
      </p>
      <MoreInfo>
        <InfoList
          items={[
            { label: "Provider", value: "National Weather Service — radar.weather.gov" },
            { label: "Product", value: "Base reflectivity, standard resolution GIF" },
            {
              label: "Projection",
              value:
                "Pre-rendered per station by the NWS — a custom raster (not a plain lat/lon grid), with county lines and range rings baked in.",
            },
            { label: "Cadence", value: "~4–6 min, one image per volume scan" },
            {
              label: "Source",
              value: (
                <a
                  href={imagery.ridge.latestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline decoration-dotted underline-offset-4"
                >
                  Latest image →
                </a>
              ),
            },
          ]}
        />
      </MoreInfo>
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
      <p className="text-xs text-muted-foreground">
        Latest global mosaic frame from RainViewer over a CARTO basemap (~10 min cadence). Blue → red = increasing
        precipitation intensity.
      </p>
      <MoreInfo>
        <InfoList
          items={[
            { label: "Provider", value: "RainViewer — global composite of national radar networks" },
            { label: "Tiles", value: `256px Web Mercator XYZ tiles, zoom ${rv.zoom}` },
            { label: "Basemap", value: "CARTO dark tiles, composited under the radar layer" },
            {
              label: "Cadence",
              value: "~10 min for observed frames; nowcast frames are short-range extrapolations, not observations.",
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
  )
}

export function RadarImageryPanel({
  imagery,
  retrievedAt,
}: {
  imagery: RadarImagery
  retrievedAt: string
}) {
  return (
    <section aria-label="Rendered radar imagery" className="rounded-lg border border-border bg-card">
      <div className="flex flex-col divide-y divide-border">
        <div className="p-4">
          <SourceBlock icon={MapIcon} title="MESONET">
            <BaseMap
              bbox={imagery.iem.bbox as [number, number, number, number]}
              center={{
                lon: (imagery.iem.bbox[0] + imagery.iem.bbox[2]) / 2,
                lat: (imagery.iem.bbox[1] + imagery.iem.bbox[3]) / 2,
              }}
              overlayUrl={imagery.iem.reflectivityUrl}
              overlayToken={retrievedAt}
            />
          </SourceBlock>
        </div>

        <div className="p-4">
          <SourceBlock icon={Radio} title="NWS RIDGE">
            <RidgeView imagery={imagery} token={retrievedAt} />
          </SourceBlock>
        </div>

        {imagery.rainviewer && (
          <div className="p-4">
            <SourceBlock icon={Satellite} title="Live mosaic">
              <RainViewerView imagery={imagery} />
            </SourceBlock>
          </div>
        )}
      </div>
    </section>
  )
}
