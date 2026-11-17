"use client";
import React from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import { Field, FieldLabel } from "#/app/ui/field";
import { findStation } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-busy={pending}
      className="inline-flex min-h-11 w-auto! shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-base font-medium whitespace-nowrap text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      disabled={disabled || pending}
      type="submit"
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
  const [query, setQuery] = React.useState(initialQuery);

  return (
    <form action={findStation} className="w-full">
      <Field orientation="horizontal">
        <span className="sr-only">
          <FieldLabel htmlFor="location-query">City or place name</FieldLabel>
        </span>
        <Input
          className="flex h-11 min-w-0 flex-1 rounded-xl border border-input bg-secondary/40 px-3 text-base shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-base dark:bg-secondary/40"
          id="location-query"
          name="query"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g. Austin, TX"
          required
          value={query}
        />
        <SubmitButton disabled={query.trim() === ""} />
      </Field>
    </form>
  );
}
