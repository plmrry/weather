import React from "react";
import { Content, Root } from "#/app/ui/card";
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
    <Root aria-label="Coordinate input">
      <Content>
        <FieldGroup>
          <FieldSeparator className="text-xs tracking-wider uppercase **:data-[slot=field-separator-content]:mx-0! **:data-[slot=field-separator-content]:bg-card">
            find a station
          </FieldSeparator>

          <Field>
            <React.Suspense fallback={<FindStationForm params={undefined} />}>
              <FindStationForm params={params} />
            </React.Suspense>
          </Field>

          <FieldSeparator className="text-xs tracking-wider uppercase **:data-[slot=field-separator-content]:mx-0! **:data-[slot=field-separator-content]:bg-card">
            or use your current location
          </FieldSeparator>

          <Field>
            <ClientLocation />
          </Field>

          <FieldSeparator className="text-xs tracking-wider uppercase **:data-[slot=field-separator-content]:mx-0! **:data-[slot=field-separator-content]:bg-card">
            or use recent locations
          </FieldSeparator>

          <Field>
            <React.Suspense fallback={<RecentLocations params={undefined} />}>
              <RecentLocations params={params} />
            </React.Suspense>
          </Field>
        </FieldGroup>
      </Content>
    </Root>
  );
}
