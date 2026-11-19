import React from "react";
import { CurrentStation } from "./sections/current-station";
import { FindStation } from "./sections/find-station";
import { MapSections } from "./sections/map-sections";

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

      <CurrentStation params={params} />

      <MapSections params={params} />
    </main>
  );
}
