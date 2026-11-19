import workerThreads from "node:worker_threads";
import type { parseRadarData } from "./parse-radar-data";

type RadarData = {
  layers: ({
    fill: string;
  } & ReturnType<typeof parseRadarData>["layers"][number])[];
  mapSize: number;
};

let pending: Promise<unknown> = Promise.resolve();

export function processRadarData(
  bytes: Uint8Array,
  mapCoordinates: [number, number],
): Promise<RadarData> {
  const result = pending.then(
    () =>
      new Promise<RadarData>((resolve, reject) => {
        const worker = new workerThreads.Worker(
          new URL("./radar-worker.ts", import.meta.url),
          { workerData: { bytes, mapCoordinates } },
        );
        let data: RadarData | undefined;
        worker.once("message", (result: RadarData) => {
          data = result;
        });
        worker.once("error", reject);
        worker.once("exit", (code) => {
          if (code === 0 && data) {
            resolve(data);
          } else {
            reject(
              new Error(`Radar worker exited without a result (code ${code})`),
            );
          }
        });
      }),
  );
  pending = result.catch(() => undefined);
  return result;
}
