"use client";

import { Button } from "@base-ui/react/button";
import { useRouter } from "next/navigation";
import React from "react";
import { getLocation } from "./actions";

export function ClientLocation(): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isLocating, setIsLocating] = React.useState(false);

  function getCurrentLocation(): void {
    setIsLocating(true);
    window.navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setIsLocating(false);
        const formData = new FormData();
        formData.set("latitude", String(coords.latitude));
        formData.set("longitude", String(coords.longitude));

        startTransition(async () => {
          const location = await getLocation(formData);
          const latitude = location.latitude.toFixed(3);
          const longitude = location.longitude.toFixed(3);
          router.push(`/latitude/${latitude}/longitude/${longitude}`);
        });
      },
      () => setIsLocating(false),
    );
  }

  const isLoading = isLocating || isPending;

  return (
    <Button
      type="button"
      className="inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-base font-medium text-primary-foreground whitespace-nowrap transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      disabled={isLoading}
      aria-busy={isLoading}
      onClick={getCurrentLocation}
    >
      {isLoading ? "Finding Station…" : "Use My Location"}
    </Button>
  );
}
