"use client";

import { Map as MapIcon } from "lucide-react";
import * as React from "react";
import type { JSX } from "react";

import { Button } from "@/components/ui/button";

import { generateRandomNumbers } from "./actions";

const initialRandomNumbers: number[] = [];

/** Iowa Environmental Mesonet — WMS reflectivity mosaic layered beneath a d3-geo reference map. */
export function MesonetPanelV2(): JSX.Element {
  const [randomNumbers, generateRandomNumbersAction, isPending] = React.useActionState(
    generateRandomNumbers,
    initialRandomNumbers,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapIcon className="size-3.5 shrink-0" />
        TODO
      </p>
      {/* <MoreInfo>
        <InfoList
          items={[
            {
              label: "Sources",
              value: "TODO",
            },
          ]}
        />
      </MoreInfo> */}
      {/* {overlayToken && <Stamp iso={overlayToken} />} */}
      <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-md border border-border bg-black"></div>
      <form action={generateRandomNumbersAction} className="flex flex-col items-start gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Generating…" : "Generate random numbers"}
        </Button>
        <output className="font-mono text-xs" aria-live="polite">
          {JSON.stringify(randomNumbers)}
        </output>
      </form>
    </div>
  );
}
