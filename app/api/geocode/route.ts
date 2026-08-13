import { generateText, Output, jsonSchema } from "ai";
import { type NextRequest, NextResponse } from "next/server";

// Fast, cheap model for a simple place-name -> coordinate guess.
// OpenAI is zero-config through the Vercel AI Gateway on v0.
const MODEL = "openai/gpt-4.1-nano";

type GeocodeResult = {
  found: boolean;
  lat: number | null;
  lon: number | null;
  resolvedName: string | null;
};

const schema = jsonSchema<GeocodeResult>({
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

export async function POST(req: NextRequest) {
  let query = "";
  try {
    const body = await req.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json({ error: "Enter a city or place name." }, { status: 400 });
  }
  if (query.length > 120) {
    return NextResponse.json({ error: "Place name is too long." }, { status: 400 });
  }

  try {
    const { output } = await generateText({
      model: MODEL,
      output: Output.object({ schema }),
      prompt: `Geocode this place: "${query}"`,
      system:
        "You are a geocoding service. Given a free-form place description (usually a US " +
        "city and optional state), return its approximate center coordinates in decimal " +
        "degrees. Prefer the most well-known place matching the input. If the input is " +
        "ambiguous or not a real place, set found=false and null coordinates.",
      // Deterministic geocoding: no creativity needed.
      temperature: 0,
    });

    if (!output.found || output.lat == null || output.lon == null) {
      return NextResponse.json(
        { error: `Couldn't find a location for "${query}". Try adding a state or country.` },
        { status: 404 },
      );
    }

    // Sanity-check the coordinates are on Earth.
    if (output.lat < -90 || output.lat > 90 || output.lon < -180 || output.lon > 180) {
      return NextResponse.json({ error: "Model returned invalid coordinates." }, { status: 502 });
    }

    return NextResponse.json({
      lat: Number(output.lat.toFixed(4)),
      lon: Number(output.lon.toFixed(4)),
      resolvedName: output.resolvedName ?? query,
    });
  } catch (err) {
    console.log("[v0] geocode error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json(
      { error: "Geocoding service failed. Try entering coordinates manually." },
      { status: 502 },
    );
  }
}
