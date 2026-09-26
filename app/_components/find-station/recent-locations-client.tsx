"use client";

import { ChevronDown } from "lucide-react";
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

function getRecentLocations(): string[] {
  try {
    const storedSearches: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

    return Array.isArray(storedSearches)
      ? storedSearches.filter((search): search is string => typeof search === "string")
      : [];
  } catch {
    return [];
  }
}

function SaveSearch({
  name,
  onSave,
}: {
  name: string | null;
  onSave: (searches: string[]) => void;
}): null {
  useEffect(() => {
    if (!name) return;

    const searches = getRecentLocations();

    if (searches.includes(name)) {
      onSave(searches);
      return;
    }

    const nextSearches = [...searches, name];

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
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRecentLocations(getRecentLocations());
  }, []);

  function selectRecentLocation(name: string): void {
    const formData = new FormData();
    formData.set("query", name);

    startTransition(() => findStation(formData));
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              className={
                recentLocations.length > 0 ? "min-h-12 w-full cursor-pointer" : "min-h-12 w-full"
              }
              disabled={recentLocations.length === 0 || isPending}
            />
          }
        >
          Recent locations
          <ChevronDown aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {recentLocations.map((name) => (
            <DropdownMenuItem
              key={name}
              className="min-h-12"
              label={name}
              onClick={() => selectRecentLocation(name)}
            >
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveSearch name={name} onSave={setRecentLocations} />
    </>
  );
}
