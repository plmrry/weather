"use client";

import { ChevronDown, History, MapPin, Trash2 } from "lucide-react";
import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RelativeTime } from "./relative-time";

export type LocationEntry = {
  lat: string;
  lon: string;
  label: string;
  station: string | null;
  at: number;
};

const STORAGE_KEY = "nexrad:location-history";
const MAX_ENTRIES = 8;

const entryKey = (e: Pick<LocationEntry, "lat" | "lon">) => `${e.lat},${e.lon}`;

/** localStorage-backed history of resolved locations, most-recent-first. */
export function useLocationHistory() {
  const [history, setHistory] = useState<LocationEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch {
      // Ignore malformed/unavailable storage.
    }
  }, []);

  const addLocation = useCallback((entry: LocationEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev.filter((e) => entryKey(e) !== entryKey(entry))].slice(
        0,
        MAX_ENTRIES,
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore write failures (private mode, quota).
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }, []);

  return { addLocation, clearHistory, history };
}

/** Dropdown of previously-viewed locations. Renders nothing when history is empty. */
export function RecentLocations({
  history,
  onSelect,
  onClear,
}: {
  history: LocationEntry[];
  onSelect: (lat: string, lon: string) => void;
  onClear: () => void;
}): JSX.Element {
  if (history.length === 0) return <></>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="min-h-11 w-full justify-between bg-secondary/40 px-3 dark:bg-secondary/40"
          />
        }
      >
        <span className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          Recent locations
          <span className="rounded-full bg-primary/15 px-1.5 font-mono text-xs text-primary">
            {history.length}
          </span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[popup-open]/button:rotate-180" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-80">
        {history.map((entry) => (
          <DropdownMenuItem
            key={`${entryKey(entry)}-${entry.at}`}
            label={entry.label}
            onClick={() => onSelect(entry.lat, entry.lon)}
            className="gap-3 px-2 py-2"
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
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={onClear}
          className="gap-2 px-2 py-2 text-xs"
        >
          <Trash2 className="size-3.5" />
          Clear history
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
