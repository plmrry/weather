"use client";

import { Button } from "@base-ui/react/button";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, Trash2 } from "lucide-react";
import { type JSX, useEffect, useState, useTransition } from "react";
import { cn } from "#/lib/utils";
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
      <Menu.Root>
        <Menu.Trigger
          render={
            <Button
              className={cn(
                "inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-base font-medium text-primary-foreground whitespace-nowrap transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                recentLocations.length > 0 && "cursor-pointer",
              )}
              disabled={recentLocations.length === 0 || isPending}
            />
          }
        >
          Recent Locations
          <ChevronDown aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            align="start"
            side="bottom"
            sideOffset={4}
            className="z-50 outline-none"
          >
            <Menu.Popup className="max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
              {recentLocations.map((location) => (
                <Menu.Item
                  key={location.name}
                  className="relative flex min-h-12 cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-muted focus:text-foreground focus:**:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
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
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <SaveSearch name={name} onSave={setRecentLocations} />
    </>
  );
}
