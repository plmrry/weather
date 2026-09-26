import React, { Suspense } from "react";
import { Card, CardContent } from "#/app/_components/ui/card";
import { Field, FieldGroup, FieldSeparator } from "#/app/_components/ui/field";
import { ClientLocation } from "./client-location";
import { FindStationForm } from "./find-station-form";
import { RecentLocations } from "./recent-locations";

type Params = Promise<{ latitude: string; longitude: string }>;

export function FindStation({ params }: { params?: Params }): React.JSX.Element {
  return (
    <Card aria-label="Coordinate input">
      <CardContent>
        <FieldGroup>
          <FieldSeparator className="text-xs uppercase tracking-wider **:data-[slot=field-separator-content]:mx-0! **:data-[slot=field-separator-content]:bg-card">
            find a station
          </FieldSeparator>

          <Field>
            <Suspense fallback={<FindStationForm params={undefined} />}>
              <FindStationForm params={params} />
            </Suspense>
          </Field>

          <FieldSeparator className="text-xs uppercase tracking-wider **:data-[slot=field-separator-content]:mx-0! **:data-[slot=field-separator-content]:bg-card">
            or use your current location
          </FieldSeparator>

          <Field>
            <ClientLocation />
          </Field>

          <FieldSeparator className="text-xs uppercase tracking-wider **:data-[slot=field-separator-content]:mx-0! **:data-[slot=field-separator-content]:bg-card">
            or use recent locations
          </FieldSeparator>

          <Field>
            <Suspense fallback={<RecentLocations params={undefined} />}>
              <RecentLocations params={params} />
            </Suspense>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
