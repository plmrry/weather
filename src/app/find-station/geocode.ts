import { generateText, jsonSchema, Output } from "ai";
import { cacheLife, cacheTag } from "next/cache";

const MODEL = "google/gemini-3.5-flash-lite";

const coordinatesSchema = jsonSchema<{
  latitude: string;
  longitude: string;
}>({
  additionalProperties: false,
  properties: {
    latitude: {
      description: "Latitude in decimal degrees (WGS84).",
      maximum: 90,
      minimum: -90,
      type: "number",
    },
    longitude: {
      description: "Longitude in decimal degrees (WGS84).",
      maximum: 180,
      minimum: -180,
      type: "number",
    },
  },
  required: ["latitude", "longitude"],
  type: "object",
});

const schema = jsonSchema<{ name: string }>({
  additionalProperties: false,
  properties: {
    name: {
      description: 'City and full state name, e.g. "Arlington, Virginia".',
      type: "string",
    },
  },
  required: ["name"],
  type: "object",
});

export async function getCoordinates(location: string): Promise<{
  latitude: string;
  longitude: string;
}> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("coordinates");

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema: coordinatesSchema }),
    prompt: `Geocode this place name: ${JSON.stringify(location)}`,
    system: `You are a worldwide geocoding service. Given a place name, return the approximate center latitude and longitude in decimal degrees using WGS84 coordinates.`,
    temperature: 0.2,
  });

  return {
    latitude: output.latitude?.toString(),
    longitude: output.longitude?.toString(),
  };
}

export function parseCoordinates(
  resolved: { latitude: string; longitude: string } | undefined,
): { latitude: number; longitude: number } | null {
  if (!resolved) return null;

  const latitude = Number(resolved.latitude);
  const longitude = Number(resolved.longitude);
  const isValid =
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;

  return isValid ? { latitude, longitude } : null;
}

export async function getLocationName(
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"],
): Promise<null | string> {
  const coordinates = parseCoordinates(await params);
  if (!coordinates) return null;

  return getLocationNameForCoordinates(
    coordinates.latitude,
    coordinates.longitude,
  );
}

async function getLocationNameForCoordinates(
  latitude: number,
  longitude: number,
): Promise<string> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("location-name");

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema }),
    prompt: `Reverse geocode latitude ${latitude} and longitude ${longitude}. Identify the city or nearest locality and state for those exact coordinates.`,
    system: `You are a geocoding service for United States locations. Given coordinates, identify their city or nearest locality and return a name formatted as city and full state name, such as "Arlington, Virginia".`,
    temperature: 0.2,
  });

  return output.name;
}
