import React from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocationFromText } from "./actions";

export function FindStationForm(): React.JSX.Element {
  async function getCoordinates(formData: FormData): Promise<void> {
    "use server";

    const coordinates = await getLocationFromText(formData);
    if (!coordinates.found || coordinates.lat === null || coordinates.lon === null) {
      return;
    }

    const searchParams = new URLSearchParams({
      latitude: String(coordinates.lat),
      longitude: String(coordinates.lon),
    });
    redirect(`/?${searchParams.toString()}`);
  }

  return (
    <form action={getCoordinates} className="flex flex-col gap-2 sm:flex-row">
      <label className="flex flex-1 flex-col gap-1.5">
        <span className="sr-only">City or place name</span>
        <Input
          name="query"
          placeholder="e.g. Austin, TX"
          className="h-11 bg-secondary/40 px-3 text-base md:text-base dark:bg-secondary/40"
          required
        />
      </label>
      <Button type="submit" variant="secondary" className="min-h-11">
        Find Station
      </Button>
    </form>
  );
}
