import React, { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldSeparator } from "@/components/ui/field";
import { ClientLocation } from "./client-location";
import { FindStationFormFields } from "./find-station-form";
import { getLocationName, parseCoordinates } from "./geocode";
import { RecentLocations } from "./recent-locations";

type Params = Promise<{ latitude: string; longitude: string }>;

async function resolveName(params?: Params): Promise<string> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  if (!coordinates) return "";
  return getLocationName(coordinates.latitude, coordinates.longitude);
}

async function FindStationFormResolver({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const name = await resolveName(params);
  return <FindStationFormFields key={name} initialQuery={name} />;
}

async function RecentLocationsResolver({
  params,
}: {
  params?: Params;
}): Promise<React.JSX.Element> {
  const name = await resolveName(params);
  return <RecentLocations name={name} />;
}

export function FindStation({ params }: { params?: Params }): React.JSX.Element {
  return (
    <Card aria-label="Coordinate input">
      <CardContent>
        <FieldGroup>
          <Field>
            <Suspense fallback={<FindStationFormFields initialQuery="" />}>
              <FindStationFormResolver params={params} />
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
            <Suspense fallback={<RecentLocations name={null} />}>
              <RecentLocationsResolver params={params} />
            </Suspense>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
