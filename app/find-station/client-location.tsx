"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ClientLocation(): React.JSX.Element {
  const router = useRouter();

  function getCurrentLocation(): void {
    window.navigator.geolocation.getCurrentPosition(({ coords }) => {
      const searchParams = new URLSearchParams({
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      });
      router.push(`/?${searchParams.toString()}`);
    });
  }

  return (
    <Button type="button" className="min-h-12 w-full text-base" onClick={getCurrentLocation}>
      Use my location
    </Button>
  );
}
