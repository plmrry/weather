import { Drive, Sandbox } from "@vercel/sandbox";
import type { RadarOverlay } from "./radar-workflow-steps";
import type { RadarBatchResult } from "./radar-workflow-steps";
import {
  compositeRadarBatchesStep,
  getRadarTimestampStep,
  prepareRadarWorkflowStep,
  readRadarOverlayStep,
  renderRadarBatchStep,
  writeRadarOverlayStep,
} from "./radar-workflow-steps";

const RADAR_DRIVE_MOUNT_PATH = "/weather-data";
const RADAR_DRIVE_NAME = "weather-data-drive";
const RADAR_SANDBOX_NAME = "weather-data";
const STATION_BATCH_SIZE = 2;

function getRadarStoragePath(
  latitude: string,
  longitude: string,
  timestamp: number,
): string {
  return `${RADAR_DRIVE_MOUNT_PATH}/${latitude}/${longitude}/${timestamp}`;
}

export async function radarOverlayWorkflow(
  latitudeKey: string,
  longitudeKey: string,
): Promise<null | RadarOverlay> {
  "use workflow";
  const latitude = Number(latitudeKey);
  const longitude = Number(longitudeKey);
  console.log("Starting radar overlay workflow", { latitude, longitude });

  const drive = await Drive.getOrCreate({ name: RADAR_DRIVE_NAME });
  const sandbox = await Sandbox.getOrCreate({
    mounts: { [RADAR_DRIVE_MOUNT_PATH]: drive },
    name: RADAR_SANDBOX_NAME,
    persistent: true,
    resume: true,
  });
  const driveMount = sandbox.mounts?.[RADAR_DRIVE_MOUNT_PATH];
  if (
    !driveMount ||
    driveMount.drive !== drive.name ||
    driveMount.mode !== "read-write"
  )
    throw new Error("Weather data drive is not mounted read-write");

  const timestamp = await getRadarTimestampStep();
  const storagePath = getRadarStoragePath(latitudeKey, longitudeKey, timestamp);
  const storedRadarOverlay = await readRadarOverlayStep(sandbox, storagePath);
  if (storedRadarOverlay) {
    console.log("Completed radar overlay workflow from persistent drive", {
      latitude,
      longitude,
      storagePath,
    });
    return storedRadarOverlay;
  }

  const preparation = await prepareRadarWorkflowStep(latitude, longitude);
  const batches: RadarBatchResult[] = [];

  for (
    let index = 0;
    index < preparation.stations.length;
    index += STATION_BATCH_SIZE
  ) {
    batches.push(
      await renderRadarBatchStep(
        latitude,
        longitude,
        preparation.stations.slice(index, index + STATION_BATCH_SIZE),
        preparation.targetBounds,
      ),
    );
  }

  const result = await compositeRadarBatchesStep(
    batches,
    preparation.stations.length,
  );
  if (result)
    await writeRadarOverlayStep(sandbox, storagePath, timestamp, result);
  console.log("Completed radar overlay workflow", {
    hasResult: result !== null,
    latitude,
    longitude,
  });
  return result;
}
