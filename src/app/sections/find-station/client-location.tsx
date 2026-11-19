"use client";

import React from "react";
import { Button } from "@base-ui/react/button";
import { useRouter } from "next/navigation";
import { getLocation } from "./actions";
import { getRecentLocations } from "./recent-locations-client";

export function ClientLocation({
  autoLocate = false,
}: {
  autoLocate?: boolean;
}): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const getCurrentLocation = React.useCallback((): void => {
    if (!navigator.geolocation) return;
    startTransition(async () => {
      const position = await new Promise<GeolocationPosition | null>(
        (resolve) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            () => resolve(null),
            { enableHighAccuracy: true },
          );
        },
      );
      if (!position) return;

      const formData = new FormData();
      formData.set("latitude", String(position.coords.latitude));
      formData.set("longitude", String(position.coords.longitude));

      const location = await getLocation(formData);
      const latitude = location.latitude.toFixed(3);
      const longitude = location.longitude.toFixed(3);
      router.push(`/latitude/${latitude}/longitude/${longitude}`);
    });
  }, [router, startTransition]);

  React.useEffect(() => {
    if (!autoLocate) return;

    const recentLocation = getRecentLocations()[0];

    if (recentLocation) {
      const formData = new FormData();
      formData.set("query", recentLocation.name);

      startTransition(async () => {
        const location = await getLocation(formData);
        const latitude = location.latitude.toFixed(3);
        const longitude = location.longitude.toFixed(3);
        router.replace(`/latitude/${latitude}/longitude/${longitude}`);
      });

      return () => {};
    }

    getCurrentLocation();
  }, [autoLocate, getCurrentLocation, router, startTransition]);

  return (
    <Button
      aria-busy={isPending}
      className="inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-base font-medium whitespace-nowrap text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      disabled={isPending}
      onClick={getCurrentLocation}
      type="button"
    >
      {isPending ? "Finding Station…" : "Use My Location"}
    </Button>
  );
}
