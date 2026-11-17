export async function getRadarStation(
  latitude: number,
  longitude: number,
): Promise<null | string> {
  const response = await fetch(
    `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
    {
      headers: { "User-Agent": "weather-app" },
    },
  );
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Unable to fetch radar station: ${response.status}`);

  const point = (await response.json()) as {
    properties?: { radarStation?: null | string };
  };

  return point.properties?.radarStation ?? null;
}
