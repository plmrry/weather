import React from "react";
import { ClientLocation } from "./client-location";
import { FindStationForm } from "./find-station-form";

export function FindStation(): React.JSX.Element {
  return (
    <section aria-label="Coordinate input" className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4">Recent locations</div>

      <ClientLocation />

      <div className="my-4 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          or search for a place
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <FindStationForm />
    </section>
  );
}
