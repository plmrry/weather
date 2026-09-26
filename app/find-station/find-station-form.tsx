"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { findStation } from "./actions";

export function FindStationFormFields({
  initialQuery,
}: {
  initialQuery: string;
}): React.JSX.Element {
  const [query, setQuery] = useState(initialQuery);

  return (
    <form action={findStation}>
      <Field className="gap-2 sm:flex-row sm:[&>*]:w-auto">
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
        <Button
          type="submit"
          className="min-h-11 cursor-pointer sm:w-auto"
          disabled={query.trim() === ""}
        >
          Find Station
        </Button>
      </Field>
    </form>
  );
}
