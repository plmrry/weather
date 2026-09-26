import type { JSX } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "#/app/_components/ui/card";
import { getLocationName, parseCoordinates } from "./find-station/geocode";

type Params = Promise<{ latitude: string; longitude: string }>;

export async function CurrentStation({ params }: { params?: Params }): Promise<JSX.Element> {
  const coordinates = parseCoordinates(params ? await params : undefined);
  const name = coordinates
    ? await getLocationName(coordinates.latitude, coordinates.longitude)
    : "No station selected";

  return (
    <Card aria-label="Current station">
      <CardHeader>
        <CardTitle>Current station</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="col-span-full">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Latitude</dt>
            <dd className="font-medium">{coordinates?.latitude ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Longitude</dt>
            <dd className="font-medium">{coordinates?.longitude ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
