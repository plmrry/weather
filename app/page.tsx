"use client"

import { useState } from "react"
import { AlertTriangle, Crosshair, LoaderCircle, Radar, RefreshCw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StationPanel, type RadarData } from "./station-panel"
import { RadarImageryPanel, type RadarImagery } from "./radar-imagery"
import { RelativeTime } from "./relative-time"
import { RecentLocations, useLocationHistory } from "./location-history"

type ApiResponse = RadarData & { imagery: RadarImagery; error?: string }

export default function Page() {
  const [lat, setLat] = useState("")
  const [lon, setLon] = useState("")
  const [place, setPlace] = useState("")
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const { history, addLocation, clearHistory } = useLocationHistory()

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
      const place = [json.location?.city, json.location?.state].filter(Boolean).join(", ")
      addLocation({
        lat: useLat.trim(),
        lon: useLon.trim(),
        label: place || json.station?.id || `${useLat.trim()}, ${useLon.trim()}`,
        station: json.station?.id ?? null,
        at: Date.now(),
      })
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
            ? "Location permission denied. Search for a city instead."
            : "Could not determine your location.",
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  async function geocodePlace() {
    const q = place.trim()
    if (q === "") {
      setError("Enter a city or place name to search.")
      return
    }
    setGeocoding(true)
    setError(null)
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      })
      const json = (await res.json()) as {
        lat?: number
        lon?: number
        resolvedName?: string
        error?: string
      }
      if (!res.ok || json.lat == null || json.lon == null) {
        setError(json.error ?? "Could not resolve that place.")
        return
      }
      const la = String(json.lat)
      const lo = String(json.lon)
      setLat(la)
      setLon(lo)
      setGeocoding(false)
      void fetchRadar(la, lo)
    } catch {
      setError("Network error while looking up that place.")
    } finally {
      setGeocoding(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col items-center justify-center gap-3 text-center">
        <span className="text-9xl leading-none" role="img" aria-label="Coffee">
          ☕
        </span>
        <h1 className="font-pixel text-5xl leading-none text-primary text-balance">Weather Café</h1>
      </header>

      <section aria-label="Coordinate input" className="rounded-lg border border-border bg-card p-4">
        {history.length > 0 && (
          <div className="mb-4">
            <RecentLocations
              history={history}
              onClear={clearHistory}
              onSelect={(selLat, selLon) => {
                setLat(selLat)
                setLon(selLon)
                void fetchRadar(selLat, selLon)
              }}
            />
          </div>
        )}

        <Button
          onClick={useMyLocation}
          disabled={locating || loading}
          className="min-h-12 w-full text-base"
        >
          {locating ? <LoaderCircle className="size-5 animate-spin" /> : <Crosshair className="size-5" />}
          {locating ? "Locating…" : "Use my location"}
        </Button>

        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">or search for a place</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="sr-only">City or place name</span>
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              onKeyDown={(e) => {
                // Don't submit while a CJK IME is composing the text.
                if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  void geocodePlace()
                }
              }}
              placeholder="e.g. Austin, TX"
              className="h-11 w-full rounded-md border border-input bg-secondary/40 px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <Button
            variant="secondary"
            onClick={geocodePlace}
            disabled={geocoding || loading}
            className="min-h-11"
          >
            {geocoding ? <LoaderCircle className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {geocoding ? "Finding…" : "Find location"}
          </Button>
        </div>

        {data && (
          <div className="mt-4 flex">
            <Button
              variant="secondary"
              onClick={() => fetchRadar(String(data.query.lat), String(data.query.lon))}
              disabled={loading}
              className="min-h-11 w-full"
            >
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {loading ? "Refreshing…" : "Refresh radar data"}
            </Button>
          </div>
        )}
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
          {data.imagery && <RadarImageryPanel imagery={data.imagery} retrievedAt={data.retrievedAt} />}

          <p className="text-center font-mono text-xs text-muted-foreground">
            Last updated <RelativeTime iso={data.retrievedAt} /> · data © NOAA / NWS (public domain) · made by paul murray with v0
          </p>
        </div>
      )}

      {!data && !error && !loading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <Radar className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground text-pretty">Select a location</p>
        </div>
      )}
    </main>
  )
}
