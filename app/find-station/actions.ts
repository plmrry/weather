"use server";

import { generateText, Output, jsonSchema } from "ai";

const MODEL = "openai/gpt-4.1-nano";

type LocationResult = {
  found: boolean;
  lat: number | null;
  lon: number | null;
  resolvedName: string | null;
};

const schema = jsonSchema<LocationResult>({
  additionalProperties: false,
  properties: {
    found: {
      description: "True only if the input clearly names a real place that can be located.",
      type: "boolean",
    },
    lat: {
      description: "Latitude in decimal degrees (WGS84), or null if not found.",
      type: ["number", "null"],
    },
    lon: {
      description: "Longitude in decimal degrees (WGS84), or null if not found.",
      type: ["number", "null"],
    },
    resolvedName: {
      description: 'Canonical place name, e.g. "San Francisco, California, USA".',
      type: ["string", "null"],
    },
  },
  required: ["found", "lat", "lon", "resolvedName"],
  type: "object",
});

export async function getLocationFromText(formData: FormData) {
  const query = formData.get("query");
  if (typeof query !== "string") {
    throw new TypeError("A location query is required.");
  }

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema }),
    prompt: `Geocode this place: "${query}"`,
    system: `You are a geocoding service for United States locations. The input will always describe a place in the United States. Given a free-form place description (usually a city and optional state), return its approximate center coordinates in decimal degrees. Prefer the most well-known place matching the input. If the input is ambiguous or not a real place, set found=false and null coordinates.`,
    temperature: 0.2,
  });
  return output;
}
