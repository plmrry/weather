import React from "react";
import Card from "#/app/ui/card";
import { Field, FieldGroup, FieldSeparator } from "#/app/ui/field";
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
    <section aria-label="Coordinate input">
      <Card.Root>
        <FieldGroup>
          <FieldSeparator>find a station</FieldSeparator>

          <Field>
            <React.ViewTransition>
              <React.Suspense
                fallback={<FindStationForm />}
                name="FindStationForm"
              >
                <FindStationForm params={params} />
              </React.Suspense>
            </React.ViewTransition>
          </Field>

          <FieldSeparator>or use your current location</FieldSeparator>

          <Field>
            <ClientLocation autoLocate={params === undefined} />
          </Field>

          <FieldSeparator>or use recent locations</FieldSeparator>

          <Field>
            <React.ViewTransition>
              <React.Suspense
                fallback={<RecentLocations />}
                name="RecentLocations"
              >
                <RecentLocations params={params} />
              </React.Suspense>
            </React.ViewTransition>
          </Field>
        </FieldGroup>
      </Card.Root>
    </section>
  );
}
