import React from "react";
import { FileText } from "lucide-react";
import { fetchForecast } from "../fetch-forecast";
import { LastUpdated } from "../last-updated";
import { Section } from "../section";
import { parseCoordinates } from "./find-station/geocode";

export function TextForecast({
  params,
}: {
  params?: Promise<{ latitude: string; longitude: string }>;
}): React.JSX.Element {
  return (
    <React.Suspense
      fallback={<TextForecastRendered fallback />}
      name="TextForecast"
    >
      <TextForecastRendered params={params} />
    </React.Suspense>
  );
}

async function TextForecastRendered({
  fallback = false,
  params,
}: {
  fallback?: boolean;
  params?: Promise<{ latitude: string; longitude: string }>;
}): Promise<React.JSX.Element> {
  const coordinates = parseCoordinates(
    !fallback && params ? await params : undefined,
  );
  const forecast = coordinates
    ? await fetchForecast(coordinates.latitude, coordinates.longitude)
    : null;
  const periods = forecast?.properties.periods;

  return (
    <Section
      aria-busy={fallback}
      ariaLabel="Text forecast"
      icon={<FileText aria-hidden="true" className="size-4" />}
      title="Text forecast"
    >
      <div>
        National Weather Service
        {forecast ? (
          <span className="block">
            Last updated:{" "}
            <LastUpdated timestamp={forecast.properties.updated} />
          </span>
        ) : null}
      </div>
      {periods?.length ? (
        <dl className="flex flex-col gap-4">
          {periods.map((period) => (
            <div key={period.number}>
              <dt className="font-semibold">{period.name}</dt>
              <dd className="mt-1 leading-relaxed text-muted-foreground">
                {period.detailedForecast}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p
          className="text-muted-foreground"
          role={fallback ? "status" : undefined}
        >
          {fallback
            ? "Loading forecast…"
            : coordinates
              ? "The text forecast is currently unavailable for this location."
              : "Select a location to see its text forecast."}
        </p>
      )}
    </Section>
  );
}
