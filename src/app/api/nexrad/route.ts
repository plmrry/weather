import type { NextRequest } from "next/server";
import {
  fetchNexradDataLatest,
  fetchNexradDataOneHour,
} from "#/app/nexrad-layer/fetch-nexrad";

export async function GET(request: NextRequest) {
  const latitude = request.nextUrl.searchParams.get("latitude");
  const longitude = request.nextUrl.searchParams.get("longitude");
  const mode = request.nextUrl.searchParams.get("mode") ?? "latest";

  if (
    !latitude?.trim() ||
    !longitude?.trim() ||
    !Number.isFinite(Number(latitude)) ||
    !Number.isFinite(Number(longitude)) ||
    Math.abs(Number(latitude)) > 90 ||
    Math.abs(Number(longitude)) > 180 ||
    (mode !== "latest" && mode !== "hour")
  ) {
    return Response.json(
      { error: "Invalid radar coordinates or mode" },
      { status: 400 },
    );
  }

  const params = Promise.resolve({ latitude, longitude });
  const data =
    mode === "hour"
      ? await fetchNexradDataOneHour(params)
      : await fetchNexradDataLatest(params);

  return Response.json(data);
}
