import React, { Suspense } from "react";
import { Card, CardContent } from "#/components/ui/card";
import { Field, FieldGroup, FieldSeparator } from "#/components/ui/field";
import { ClientLocation } from "./client-location";
import { FindStationForm } from "./find-station-form";
import { RecentLocations } from "./recent-locations";

type Params = Promise<{ latitude: string; longitude: string }>;

export function FindStation({ params }: { params?: Params }): React.JSX.Element {
  return (
    <Card aria-label="Coordinate input">
      <CardContent>
        <FieldGroup>
          <Field>
            <Suspense fallback={<FindStationForm params={undefined} />}>
              <FindStationForm params={params} />
            </Suspense>
          </Field>

          <FieldSeparator className="text-xs uppercase tracking-wider **:data-[slot=field-separator-content]:bg-card">
            or use your current location
          </FieldSeparator>

          <Field>
            <ClientLocation />
          </Field>

          <FieldSeparator className="text-xs uppercase tracking-wider **:data-[slot=field-separator-content]:bg-card">
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
