import { generateText, jsonSchema, Output } from "ai";
import { cacheLife } from "next/cache";

const MODEL = "openai/gpt-4.1-nano";

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
  latitude: number,
  longitude: number,
): Promise<string> {
  "use cache";
  cacheLife("max");

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema }),
    prompt: `Reverse geocode latitude ${latitude} and longitude ${longitude}. Identify the city or nearest locality and state for those exact coordinates.`,
    system: `You are a geocoding service for United States locations. Given coordinates, identify their city or nearest locality and return a name formatted as city and full state name, such as "Arlington, Virginia".`,
    temperature: 0.2,
  });

  return output.name;
}
