import React from "react";
import { ClearButton } from "./clear-button";
import { CurrentStation } from "./current-station";
import { FindStation } from "./find-station";
import { Panels } from "./panels";

export function WeatherPage({
  params,
}: {
  params?: Promise<{ latitude: string; longitude: string }>;
}): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col items-center justify-center gap-3 text-center">
        <span aria-label="Coffee" className="text-9xl leading-none" role="img">
          ☕
        </span>
        <h1 className="font-pixel text-5xl leading-none text-balance text-primary">
          Weather Café
        </h1>
      </header>

      <FindStation params={params} />

      <React.Suspense fallback={<CurrentStation />} name="CurrentStation">
        <CurrentStation params={params} />
      </React.Suspense>

      <React.Suspense fallback={<Panels />} name="Panels">
        <Panels params={params} />
      </React.Suspense>

      <ClearButton />
    </main>
  );
}
