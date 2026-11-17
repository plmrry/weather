import { cacheLife, cacheTag } from "next/cache";
import { start } from "workflow/api";
import type { RadarOverlay } from "./radar-workflow-steps";
import { radarOverlayWorkflow } from "./radar-workflow";

export async function getCachedRadarOverlay(
  latitude: string,
  longitude: string,
): Promise<null | RadarOverlay> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag(`radar-overlay:${latitude}/${longitude}`);

  const run = await start(radarOverlayWorkflow, [latitude, longitude]);
  return run.returnValue;
}
