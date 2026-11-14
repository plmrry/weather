import { Suspense, type JSX } from "react";
import { ClearButton } from "./clear-button";
import { CurrentStation } from "./current-station";
import { FindStation } from "./find-station";
import { Panels } from "./panels";

export function WeatherPage({
  params,
}: {
  params?: Promise<{ latitude: string; longitude: string }>;
}): JSX.Element {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      <header className="flex flex-col items-center justify-center gap-3 text-center">
        <span className="text-9xl leading-none" role="img" aria-label="Coffee">
          ☕
        </span>
        <h1 className="font-pixel text-5xl leading-none text-balance text-primary">
          Weather Café
        </h1>
      </header>

      <FindStation params={params} />

      <Suspense fallback={<CurrentStation />}>
        <CurrentStation params={params} />
      </Suspense>

      <Suspense fallback={<Panels />}>
        <Panels params={params} />
      </Suspense>

      <ClearButton />
    </main>
  );
}
