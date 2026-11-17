import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCachedRadarOverlay } from "#/app/panels/radar-cache";
import { truncateRadarCoordinate } from "#/app/panels/radar-location";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const latitudeValue = request.nextUrl.searchParams.get("latitude")?.trim();
  const longitudeValue = request.nextUrl.searchParams.get("longitude")?.trim();
  if (!latitudeValue || !longitudeValue)
    return new NextResponse("Invalid coordinates", { status: 400 });

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  )
    return new NextResponse("Invalid coordinates", { status: 400 });

  const radarOverlay = await getCachedRadarOverlay(
    truncateRadarCoordinate(latitude),
    truncateRadarCoordinate(longitude),
  );
  if (!radarOverlay) return new NextResponse(null, { status: 404 });

  const pngPrefix = "data:image/png;base64,";
  if (!radarOverlay.dataUrl.startsWith(pngPrefix))
    return new NextResponse(null, { status: 500 });

  return new NextResponse(
    Buffer.from(radarOverlay.dataUrl.slice(pngPrefix.length), "base64"),
    {
      headers: {
        "Cache-Control": "public, max-age=60",
        "Content-Type": "image/png",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
