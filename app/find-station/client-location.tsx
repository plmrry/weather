"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import { getLocation } from "./actions";

export function ClientLocation(): React.JSX.Element {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  function getCurrentLocation(): void {
    window.navigator.geolocation.getCurrentPosition(({ coords }) => {
      const formData = new FormData();
      formData.set("latitude", String(coords.latitude));
      formData.set("longitude", String(coords.longitude));

      startTransition(async () => {
        const location = await getLocation(formData);
        const latitude = location.latitude.toFixed(3);
        const longitude = location.longitude.toFixed(3);
        const searchParams = new URLSearchParams({ name: location.name });
        router.push(`/latitude/${latitude}/longitude/${longitude}?${searchParams.toString()}`);
      });
    });
  }

  return (
    <Button
      type="button"
      className="min-h-12 w-full cursor-pointer text-base"
      disabled={isPending}
      onClick={getCurrentLocation}
    >
      Use my location
    </Button>
  );
}
