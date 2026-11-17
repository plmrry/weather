import React from "react";
import { AspectRatio } from "#/app/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/ui/card";

export function NexradData(): React.JSX.Element {
  return (
    <Card aria-label="NEXRAD">
      <CardContent className="mx-auto flex w-full max-w-md flex-col gap-4">
        <CardHeader className="flex flex-col gap-1 px-0">
          <CardTitle>
            <h2 className="text-xs font-semibold tracking-wider text-foreground uppercase">
              NEXRAD
            </h2>
          </CardTitle>
        </CardHeader>
        <AspectRatio
          aria-label="Blank NEXRAD panel"
          className="w-full overflow-hidden rounded-md border border-white bg-black"
          ratio={1}
          role="img"
        />
      </CardContent>
    </Card>
  );
}
