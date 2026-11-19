import type { NextRequest } from "next/server";
import { cacheLife, cacheTag } from "next/cache";
import {
  fetchNexradDataLatest,
  fetchNexradDataOneHour,
} from "#/app/nexrad-layer/fetch-nexrad";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/latitude/[latitude]/longitude/[longitude]/nexrad-layer">,
) {
  const { latitude, longitude } = await context.params;
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

  const data = await getNexradData({
    latitude: String(Number(latitude)),
    longitude: String(Number(longitude)),
    mode,
  });

  return Response.json(data);
}

async function getNexradData({
  latitude,
  longitude,
  mode,
}: {
  latitude: string;
  longitude: string;
  mode: "hour" | "latest";
}) {
  "use cache: remote";

  const cacheKey = `nexrad-data:${mode}:${latitude}:${longitude}`;
  cacheLife("minutes");
  cacheTag("nexrad-data", cacheKey);

  const params = Promise.resolve({ latitude, longitude });
  const data =
    mode === "hour"
      ? await fetchNexradDataOneHour(params)
      : await fetchNexradDataLatest(params);

  return data;
}
