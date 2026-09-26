"use client";

import type { JSX } from "react";
import { Button } from "#/components/ui/button";

export function ClearButton(): JSX.Element {
  function clearLocalStorage(): void {
    try {
      localStorage.clear();
    } catch {
      // Continue clearing the page when storage is unavailable.
    }
  }

  return (
    <form action="/" onSubmit={clearLocalStorage}>
      <Button className="min-h-12 w-full cursor-pointer text-base" type="submit">
        Clear
      </Button>
    </form>
  );
}
