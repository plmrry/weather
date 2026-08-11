"use client"

import { useState } from "react"
import { Antenna, ChevronDown, Gauge, MapPin, Mountain, Timer } from "lucide-react"

export type RadarData = {
  query: { lat: number; lon: number }
  location: {
    city: string | null
    state: string | null
    timeZone: string | null
    forecastOffice: string | null
    gridId: string | null
    gridX: number | null
    gridY: number | null
  }
  station: {
    id: string
    name?: string | null
    stationType?: string | null
    lat?: number | null
    lon?: number | null
    elevationMeters?: number | null
    timeZone?: string | null
    distanceKm?: number | null
    rda?: {
      operabilityStatus?: string | null
      mode?: string | null
      volumeCoveragePattern?: string | null
      reflectivity?: boolean | null
    } | null
    latencyCurrentSeconds?: number | null
    latencyAverageSeconds?: number | null
  }
  sources: {
    pointJson: string
    stationJson: string
    bucketListing: string
  }
  fileCount: number
  retrievedAt: string
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-secondary/40 p-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-sm text-foreground">{value}</div>
      </div>
    </div>
  )
}

export function StationPanel({ data }: { data: RadarData }) {
  const { station, location } = data
  const place = [location.city, location.state].filter(Boolean).join(", ") || "Unknown locality"
  const status = station.rda?.operabilityStatus ?? null
  const online = status ? /oper|up|rda/i.test(status) : null
  const [open, setOpen] = useState(false)

  return (
    <section aria-labelledby="station-heading" className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Antenna className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 id="station-heading" className="font-mono text-2xl font-semibold text-foreground">
              {station.id}
            </h2>
            {/* "Nearest to" is always visible, even when collapsed. */}
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground text-pretty">
              <MapPin className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">Nearest to {place}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {online !== null && (
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium sm:inline-flex ${
                online
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              <span className={`size-2 rounded-full ${online ? "bg-primary" : "bg-destructive"}`} />
              {status}
            </span>
          )}
          <ChevronDown className={`size-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-3 border-t border-border p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Stat icon={MapPin} label="Nearest to" value={place} />
          <Stat
            icon={Antenna}
            label="Distance from point"
            value={station.distanceKm != null ? `${station.distanceKm} km` : "—"}
          />
          <Stat
            icon={Mountain}
            label="Elevation"
            value={station.elevationMeters != null ? `${Math.round(station.elevationMeters)} m` : "—"}
          />
          <Stat
            icon={Gauge}
            label="Volume coverage pattern"
            value={station.rda?.volumeCoveragePattern ? `VCP ${station.rda.volumeCoveragePattern}` : "—"}
          />
          <Stat
            icon={Timer}
            label="Feed latency"
            value={station.latencyCurrentSeconds != null ? `${Math.round(station.latencyCurrentSeconds)} s` : "—"}
          />
          <Stat
            icon={MapPin}
            label="Station coordinates"
            value={
              station.lat != null && station.lon != null
                ? `${station.lat.toFixed(3)}, ${station.lon.toFixed(3)}`
                : "—"
            }
          />
        </div>
      )}
    </section>
  )
}
