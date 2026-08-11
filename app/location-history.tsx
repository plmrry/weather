"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronDown, History, MapPin, Trash2 } from "lucide-react"
import { RelativeTime } from "./relative-time"

export type LocationEntry = {
  lat: string
  lon: string
  label: string
  station: string | null
  at: number
}

const STORAGE_KEY = "nexrad:location-history"
const MAX_ENTRIES = 8

const entryKey = (e: Pick<LocationEntry, "lat" | "lon">) => `${e.lat},${e.lon}`

/** localStorage-backed history of resolved locations, most-recent-first. */
export function useLocationHistory() {
  const [history, setHistory] = useState<LocationEntry[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setHistory(parsed)
      }
    } catch {
      // Ignore malformed/unavailable storage.
    }
  }, [])

  const addLocation = useCallback((entry: LocationEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((e) => entryKey(e) !== entryKey(entry))].slice(0, MAX_ENTRIES)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Ignore write failures (private mode, quota).
      }
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore.
    }
  }, [])

  return { history, addLocation, clearHistory }
}

/** Dropdown of previously-viewed locations. Renders nothing when history is empty. */
export function RecentLocations({
  history,
  onSelect,
  onClear,
}: {
  history: LocationEntry[]
  onSelect: (lat: string, lon: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  if (history.length === 0) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          Recent locations
          <span className="rounded-full bg-primary/15 px-1.5 font-mono text-xs text-primary">{history.length}</span>
        </span>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Recent locations"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          {history.map((entry) => (
            <button
              key={`${entryKey(entry)}-${entry.at}`}
              type="button"
              role="option"
              aria-selected={false}
              onClick={() => {
                onSelect(entry.lat, entry.lon)
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:outline-none"
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{entry.label}</span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {entry.lat}, {entry.lon}
                  {entry.station ? ` · ${entry.station}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                <RelativeTime iso={new Date(entry.at).toISOString()} />
              </span>
            </button>
          ))}

          <div className="mt-1 border-t border-border pt-1">
            <button
              type="button"
              onClick={() => {
                onClear()
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none"
            >
              <Trash2 className="size-3.5" />
              Clear history
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
