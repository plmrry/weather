"use client";

import React from "react";
import { Button } from "@base-ui/react/button";
import { usePathname, useRouter } from "next/navigation";
import { getLocation } from "./actions";

export function ClientLocation(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = React.useTransition();
  const [isLocating, setIsLocating] = React.useState(false);

  React.useEffect(() => {
    if (pathname !== "/" || !navigator.geolocation) return;

    let active = true;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!active) return;

        const latitude = coords.latitude.toFixed(3);
        const longitude = coords.longitude.toFixed(3);
        router.replace(`/latitude/${latitude}/longitude/${longitude}`);
      },
      () => {},
      { timeout: 10000 },
    );

    return () => {
      active = false;
    };
  }, [pathname, router]);

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
      aria-busy={isLoading}
      className="inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-base font-medium whitespace-nowrap text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
      disabled={isLoading}
      onClick={getCurrentLocation}
      type="button"
    >
      {isLoading ? "Finding Station…" : "Use My Location"}
    </Button>
  );
}
