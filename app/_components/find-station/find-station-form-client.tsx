"use client";

import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "#/components/ui/button";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { findStation } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }): React.JSX.Element {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="min-h-11 cursor-pointer text-base sm:w-auto"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending ? "Finding Station…" : "Find Station"}
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
    <form action={findStation}>
      <Field className="gap-2 sm:flex-row sm:*:w-auto">
        <FieldLabel className="sr-only" htmlFor="location-query">
          City or place name
        </FieldLabel>
        <Input
          id="location-query"
          name="query"
          placeholder="e.g. Austin, TX"
          className="h-11 bg-secondary/40 px-3 text-base sm:flex-1 md:text-base dark:bg-secondary/40"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          required
        />
        <SubmitButton disabled={query.trim() === ""} />
      </Field>
    </form>
  );
}
