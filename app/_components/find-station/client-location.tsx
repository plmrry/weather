"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "#/components/ui/button";
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
      className="min-h-12 w-full cursor-pointer text-base"
      disabled={isLoading}
      aria-busy={isLoading}
      onClick={getCurrentLocation}
    >
      {isLoading ? "Finding Station…" : "Use my location"}
    </Button>
  );
}
