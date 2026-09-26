"use server";

import { generateText, Output, jsonSchema } from "ai";
import { redirect } from "next/navigation";

const MODEL = "openai/gpt-4.1-nano";

export type LocationResult = {
  latitude: number;
  longitude: number;
  name: string;
};

const schema = jsonSchema<LocationResult>({
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
    name: {
      description: 'City and full state name, e.g. "Arlington, Virginia".',
      type: "string",
    },
  },
  required: ["latitude", "longitude", "name"],
  type: "object",
});

export async function getLocation(formData: FormData): Promise<LocationResult> {
  const query = formData.get("query");
  const latitudeValue = formData.get("latitude");
  const longitudeValue = formData.get("longitude");
  const latitude = typeof latitudeValue === "string" ? Number(latitudeValue) : Number.NaN;
  const longitude = typeof longitudeValue === "string" ? Number(longitudeValue) : Number.NaN;
  const hasCoordinates =
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180;

  let prompt: string;
  if (typeof query === "string" && query.trim() !== "") {
    prompt = `Geocode this United States place description: ${JSON.stringify(query.trim())}`;
  } else if (hasCoordinates) {
    prompt = `Reverse geocode latitude ${latitude} and longitude ${longitude}. Return those exact coordinates with the location name.`;
  } else {
    throw new TypeError("A location query or valid latitude and longitude are required.");
  }

  const { output } = await generateText({
    model: MODEL,
    output: Output.object({ schema }),
    prompt,
    system: `You are a geocoding service for United States locations. Given either a free-form place description or coordinates, return latitude, longitude, and a name formatted as city and full state name, such as "Arlington, Virginia". For a place description, use the approximate center coordinates of the most well-known matching place. For coordinates, preserve the supplied coordinates exactly and identify their city or nearest locality and state.`,
    temperature: 0.2,
  });
  return hasCoordinates ? { ...output, latitude, longitude } : output;
}

export async function findStation(formData: FormData): Promise<void> {
  const location = await getLocation(formData);

  const latitude = location.latitude.toFixed(3);
  const longitude = location.longitude.toFixed(3);
  const searchParams = new URLSearchParams({ name: location.name });
  redirect(`/latitude/${latitude}/longitude/${longitude}?${searchParams.toString()}`);
}
