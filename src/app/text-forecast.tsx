import React from "react";
import { fetchForecast } from "./fetch-forecast";
import { parseCoordinates } from "./find-station/geocode";
import { LastUpdated } from "./last-updated";
import Card from "./ui/card";

export async function TextForecast({
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
    <section aria-busy={fallback} aria-label="Text forecast">
      <Card.Root>
        <Card.Header>
          <Card.Title>
            <h2>Text forecast</h2>
          </Card.Title>
          <Card.Description>
            National Weather Service
            {forecast ? (
              <span className="block">
                Last updated:{" "}
                <LastUpdated timestamp={forecast.properties.updated} />
              </span>
            ) : null}
          </Card.Description>
        </Card.Header>
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
      </Card.Root>
    </section>
  );
}
