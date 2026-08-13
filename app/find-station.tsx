import React from "react";

import { Button } from "@/components/ui/button";

export function FindStation(): React.JSX.Element {
  return (
    <section aria-label="Coordinate input" className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4">
        Recent locations
      </div>

      <Button className="min-h-12 w-full text-base">Use my location</Button>

      <div className="my-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          or search for a place
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="sr-only">City or place name</span>
          <input
            placeholder="e.g. Austin, TX"
            className="h-11 w-full rounded-md border border-input bg-secondary/40 px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <Button variant="secondary" className="min-h-11">
          Find Station
        </Button>
      </div>
    </section>
  );
}
