"use client";

import { Button } from "@base-ui/react/button";
import type { JSX } from "react";

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
      <Button
        className="inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-base font-medium text-primary-foreground whitespace-nowrap transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
        type="submit"
      >
        Clear
      </Button>
    </form>
  );
}
