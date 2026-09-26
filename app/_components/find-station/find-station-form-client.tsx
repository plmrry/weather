"use client";

import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { Field, FieldLabel } from "#/app/_components/ui/field";
import { findStation } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground whitespace-nowrap transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 w-auto! [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? "Searching…" : "Search"}
    </Button>
  );
}

export function FindStationFormClient({
  initialQuery,
}: {
  initialQuery: string;
}): React.JSX.Element {
  const [query, setQuery] = useState(initialQuery);

  return (
    <form action={findStation} className="w-full">
      <Field className="w-full flex-row items-center gap-2">
        <FieldLabel className="sr-only" htmlFor="location-query">
          City or place name
        </FieldLabel>
        <Input
          id="location-query"
          name="query"
          placeholder="e.g. Austin, TX"
          className="flex h-11 min-w-0 flex-1 rounded-xl border border-input bg-secondary/40 px-3 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-base dark:bg-secondary/40"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <SubmitButton disabled={query.trim() === ""} />
      </Field>
    </form>
  );
}
