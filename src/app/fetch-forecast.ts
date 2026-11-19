import { cacheLife, cacheTag } from "next/cache";

type Forecast = {
  properties: {
    periods: {
      detailedForecast: string;
      name: string;
      number: number;
    }[];
    updated: string;
  };
};

async function fetchForecastJson<T>(url: string): Promise<null | T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "(weather-cafe.vercel.app, paul@paulmurray.lol)",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) return null;

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchForecast(latitude: number, longitude: number) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("forecast");

  const point = await fetchForecastJson<{
    properties: { forecast: null | string };
  }>(`https://api.weather.gov/points/${latitude},${longitude}`);

  if (!point?.properties.forecast) return null;

  return fetchForecastJson<Forecast>(point.properties.forecast);
}
