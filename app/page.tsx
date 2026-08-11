"use client"

import { useState } from "react"
import { AlertTriangle, Code2, Crosshair, LoaderCircle, Radar, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StationPanel, type RadarData } from "./station-panel"
import { FileList, type RadarFile } from "./file-list"

type ApiResponse = RadarData & { files: RadarFile[]; error?: string }

export default function Page() {
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [showJson, setShowJson] = useState(false)

  async function fetchRadar(useLat: string, useLon: string) {
    if (useLat.trim() === "" || useLon.trim() === "") {
      setError("Enter both a latitude and a longitude.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/radar?lat=${encodeURIComponent(useLat)}&lon=${encodeURIComponent(useLon)}`)
      const json = (await res.json()) as ApiResponse
      if (!res.ok) {
        setData(null)
        setError(json.error ?? `Request failed (${res.status}).`)
        return
      }
      setData(json)
    } catch {
      setData(null)
      setError("Network error while contacting NOAA services.")
    } finally {
      setLoading(false)
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not available in this browser.")
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude.toFixed(4)
        const lo = pos.coords.longitude.toFixed(4)
        setLat(la)
        setLon(lo)
        setLocating(false)
        void fetchRadar(la, lo)
      },
      (err) => {
        setLocating(false)
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enter coordinates manually."
            : "Could not determine your location.",
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Radar className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
              NEXRAD Radar Explorer
            </h1>
            <p className="text-sm text-muted-foreground">Live NOAA / NWS Level II radar data by coordinate</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Enter a latitude and longitude (or use your location) to resolve the nearest WSR-88D radar station and
          browse its raw Level II volume-scan files, served live from NOAA&apos;s public S3 archive.
        </p>
      </header>

      <section aria-label="Coordinate input" className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Latitude</span>
            <input
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="37.7749"
              className="h-11 rounded-md border border-input bg-secondary/40 px-3 font-mono text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Longitude</span>
            <input
              inputMode="decimal"
              value={lon}
              onChange={(e) => setLon(e.target.value)}
              placeholder="-122.4194"
              className="h-11 rounded-md border border-input bg-secondary/40 px-3 font-mono text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => fetchRadar(lat, lon)} disabled={loading} className="min-h-11 flex-1 sm:flex-none">
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Radar className="size-4" />}
            {loading ? "Fetching…" : "Fetch radar data"}
          </Button>
          <Button
            variant="secondary"
            onClick={useMyLocation}
            disabled={locating}
            className="min-h-11 flex-1 sm:flex-none"
          >
            {locating ? <LoaderCircle className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
            Use my location
          </Button>
          {data && (
            <Button
              variant="ghost"
              onClick={() => fetchRadar(String(data.query.lat), String(data.query.lon))}
              disabled={loading}
              className="min-h-11"
              aria-label="Refresh radar data"
            >
              <RefreshCw className="size-4" />
            </Button>
          )}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {data && !error && (
        <div className="flex flex-col gap-6">
          <StationPanel data={data} />
          <FileList files={data.files} fileCount={data.fileCount} bucketListing={data.sources.bucketListing} />

          <section className="rounded-lg border border-border bg-card">
            <button
              onClick={() => setShowJson((s) => !s)}
              className="flex w-full items-center justify-between gap-2 p-4 text-left"
              aria-expanded={showJson}
            >
              <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                <Code2 className="size-4 text-primary" />
                Raw station metadata (JSON)
              </span>
              <span className="font-mono text-xs text-muted-foreground">{showJson ? "hide" : "show"}</span>
            </button>
            {showJson && (
              <div className="border-t border-border p-4">
                <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
                  <a
                    href={data.sources.pointJson}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline decoration-dotted underline-offset-4"
                  >
                    /points JSON →
                  </a>
                  <a
                    href={data.sources.stationJson}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline decoration-dotted underline-offset-4"
                  >
                    /radar/stations JSON →
                  </a>
                </div>
                <pre className="max-h-96 overflow-auto rounded-md bg-secondary/40 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {JSON.stringify({ location: data.location, station: data.station }, null, 2)}
                </pre>
              </div>
            )}
          </section>

          <p className="text-center font-mono text-xs text-muted-foreground">
            Retrieved {new Date(data.retrievedAt).toLocaleString()} · data © NOAA / NWS (public domain)
          </p>
        </div>
      )}

      {!data && !error && !loading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Radar className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground text-pretty">
            NEXRAD coverage spans the continental U.S., Alaska, Hawaii, Guam, and Puerto Rico. Try{" "}
            <button
              className="font-mono text-primary underline decoration-dotted underline-offset-4"
              onClick={() => {
                setLat("37.7749")
                setLon("-122.4194")
                void fetchRadar("37.7749", "-122.4194")
              }}
            >
              37.7749, -122.4194
            </button>{" "}
            (San Francisco).
          </p>
        </div>
      )}
    </main>
  )
}
