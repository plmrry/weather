"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { type JSX, useEffect, useState, useTransition } from "react";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { findStation } from "./actions";

const STORAGE_KEY = "recentLocations";

type RecentLocation = {
  name: string;
  lastUsedAt: string;
};

function getRecentLocations(): RecentLocation[] {
  try {
    const storedSearches: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

    if (!Array.isArray(storedSearches)) return [];

    return storedSearches
      .flatMap((search, index): RecentLocation[] => {
        if (typeof search === "string") {
          return [{ lastUsedAt: new Date(index).toISOString(), name: search }];
        }

        if (
          typeof search === "object" &&
          search !== null &&
          "name" in search &&
          typeof search.name === "string" &&
          "lastUsedAt" in search &&
          typeof search.lastUsedAt === "string"
        ) {
          return [{ lastUsedAt: search.lastUsedAt, name: search.name }];
        }

        return [];
      })
      .sort((a, b) => Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt));
  } catch {
    return [];
  }
}

function SaveSearch({
  name,
  onSave,
}: {
  name: string | null;
  onSave: (searches: RecentLocation[]) => void;
}): null {
  useEffect(() => {
    if (!name) return;

    const searches = getRecentLocations();
    const nextSearches = [
      { lastUsedAt: new Date().toISOString(), name },
      ...searches.filter((search) => search.name !== name),
    ];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSearches));
      onSave(nextSearches);
    } catch {
      // Ignore unavailable storage.
    }
  }, [name, onSave]);

  return null;
}

export function RecentLocationsClient({ name }: { name: string | null }): JSX.Element {
  const [recentLocations, setRecentLocations] = useState<RecentLocation[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRecentLocations(getRecentLocations());
  }, []);

  function selectRecentLocation(name: string): void {
    const formData = new FormData();
    formData.set("query", name);

    startTransition(() => findStation(formData));
  }

  function removeRecentLocation(name: string): void {
    setRecentLocations((searches) => {
      const nextSearches = searches.filter((search) => search.name !== name);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSearches));
      } catch {
        // Ignore unavailable storage.
      }

      return nextSearches;
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={
                recentLocations.length > 0
                  ? "min-h-12 w-full cursor-pointer text-base"
                  : "min-h-12 w-full text-base"
              }
              disabled={recentLocations.length === 0 || isPending}
            />
          }
        >
          Recent Locations
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {recentLocations.map((location) => (
            <DropdownMenuItem
              key={location.name}
              className="min-h-12 focus:bg-muted focus:text-foreground focus:**:text-foreground"
              label={location.name}
              onClick={() => selectRecentLocation(location.name)}
            >
              {location.name}
              <button
                type="button"
                className="ml-auto cursor-pointer rounded p-1 text-muted-foreground opacity-100 hover:bg-muted hover:text-foreground hover:opacity-100"
                aria-label={`Remove ${location.name} from recent searches`}
                onClick={(event) => {
                  event.stopPropagation();
                  removeRecentLocation(location.name);
                }}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveSearch name={name} onSave={setRecentLocations} />
    </>
  );
}
