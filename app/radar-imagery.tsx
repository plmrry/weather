"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Image as ImageIcon, Layers, Pause, Play, Radio, Satellite } from "lucide-react"

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

type SourceKey = "ridge" | "rainviewer" | "iem"

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

function relAge(ms: number) {
  const mins = Math.round(ms / 60000)
  if (mins <= 0) return "now"
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)} h ago`
}

/** NWS RIDGE — government per-station imagery: latest still or animated loop. */
function RidgeView({ imagery, token }: { imagery: RadarImagery; token: string }) {
  const [mode, setMode] = useState<"latest" | "loop">("latest")
  const src = mode === "latest" ? imagery.ridge.latestUrl : imagery.ridge.loopUrl
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(["latest", "loop"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`min-h-9 rounded-md border px-3 text-xs font-medium capitalize transition-colors ${
              mode === m
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary/40"
            }`}
            aria-pressed={mode === m}
          >
            {m === "latest" ? "Latest frame" : "Animated loop"}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-md border border-border bg-secondary/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={mode + token}
          src={bust(src, token) || "/placeholder.svg"}
          alt={`NWS RIDGE base reflectivity ${mode === "loop" ? "animated loop" : "latest frame"}`}
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

/** RainViewer — near-real-time global mosaic composited over a basemap, animated. */
function RainViewerView({ imagery }: { imagery: RadarImagery }) {
  const rv = imagery.rainviewer!
  const cells = useMemo(() => {
    const out: { dx: number; dy: number }[] = []
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) out.push({ dx, dy })
    return out
  }, [])

  const [index, setIndex] = useState(Math.max(0, rv.frames.length - 1))
  const [playing, setPlaying] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!playing || rv.frames.length <= 1) return
    timer.current = setInterval(() => setIndex((i) => (i + 1) % rv.frames.length), 700)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, rv.frames.length])

  const frame = rv.frames[index]
  if (!frame) return null

  const tileUrl = (dx: number, dy: number) =>
    `${rv.host}${frame.path}/${rv.tileSize}/${rv.zoom}/${rv.center.x + dx}/${rv.center.y + dy}/${rv.color}/${rv.options}.png`
  const baseUrl = (dx: number, dy: number) =>
    rv.basemapTemplate
      .replace("{z}", String(rv.zoom))
      .replace("{x}", String(rv.center.x + dx))
      .replace("{y}", String(rv.center.y + dy))

  const ageMs = Date.now() - frame.time * 1000

  return (
    <div className="flex flex-col gap-3">
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
          {frame.kind === "nowcast" && <span className="ml-1 text-accent">· forecast</span>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-secondary/40"
          aria-label={playing ? "Pause animation" : "Play animation"}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={rv.frames.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false)
            setIndex(Number(e.target.value))
          }}
          className="h-1.5 flex-1 cursor-pointer accent-primary"
          aria-label="Scrub radar frames"
        />
        <span className="w-16 shrink-0 text-right font-mono text-[0.7rem] text-muted-foreground">
          {frame.kind === "nowcast" ? "+" + relAge(-ageMs).replace(" ago", "") : relAge(ageMs)}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Global near-real-time mosaic from RainViewer over a CARTO basemap (~10 min cadence). Blue → red = increasing
        precipitation intensity.
      </p>
    </div>
  )
}

/** Iowa Environmental Mesonet — WMS base-reflectivity mosaic around the point. */
function IemView({ imagery, token }: { imagery: RadarImagery; token: string }) {
  return (
    <div className="flex flex-col gap-3">
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
  const sources: { key: SourceKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "ridge", label: "NWS RIDGE", icon: Radio },
    ...(imagery.rainviewer ? [{ key: "rainviewer" as const, label: "Live mosaic", icon: Satellite }] : []),
    { key: "iem", label: "Mesonet", icon: Layers },
  ]
  const [source, setSource] = useState<SourceKey>("ridge")

  return (
    <section aria-labelledby="imagery-heading" className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="size-4 text-accent" />
          <h2 id="imagery-heading" className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Rendered radar imagery
          </h2>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{sources.length} sources</span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border p-4">
        {sources.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSource(key)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors ${
              source === key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:bg-secondary/40"
            }`}
            aria-pressed={source === key}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {source === "ridge" && <RidgeView imagery={imagery} token={retrievedAt} />}
        {source === "rainviewer" && imagery.rainviewer && <RainViewerView imagery={imagery} />}
        {source === "iem" && <IemView imagery={imagery} token={retrievedAt} />}
      </div>
    </section>
  )
}
