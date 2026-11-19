import React from "react";
import { Search } from "lucide-react";
import { Field, FieldGroup, FieldSeparator } from "#/app/field";
import { Section } from "#/app/section";
import { ClientLocation } from "./client-location";
import { FindStationForm } from "./find-station-form";
import { RecentLocations } from "./recent-locations";

type Params = Promise<{ latitude: string; longitude: string }>;

export function FindStation({
  params,
}: {
  params?: Params;
}): React.JSX.Element {
  return (
    <React.Suspense
      fallback={<FindStationRendered fallback />}
      name="FindStation"
    >
      <FindStationRendered params={params} />
    </React.Suspense>
  );
}

function FindStationRendered({
  fallback = false,
  params,
}: {
  fallback?: boolean;
  params?: Params;
}): React.JSX.Element {
  return (
    <Section
      aria-busy={fallback}
      ariaLabel="Coordinate input"
      icon={<Search aria-hidden="true" className="size-4" />}
      title="Find a station"
    >
      <FieldGroup>
        <Field>
          <FindStationForm params={fallback ? undefined : params} />
        </Field>

        <FieldSeparator>or use your current location</FieldSeparator>

        <Field>
          <ClientLocation autoLocate={params === undefined} />
        </Field>

        <FieldSeparator>or use recent locations</FieldSeparator>

        <Field>
          <RecentLocations params={fallback ? undefined : params} />
        </Field>
      </FieldGroup>
    </Section>
  );
}
