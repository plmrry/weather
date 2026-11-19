"use client";

import React from "react";
import type { NexradResponses, RadarCoordinates } from "./types";

function createRadarRequest<Data>(url: string) {
  const pending = new Promise<Data>(() => {});
  let promise = pending;
  let controller: AbortController | undefined;
  const listeners = new Set<() => void>();

  return {
    getServerSnapshot: () => pending,
    getSnapshot: () => promise,
    subscribe(listener: () => void) {
      listeners.add(listener);

      if (promise === pending) {
        controller = new AbortController();
        promise = fetch(url, { signal: controller.signal }).then((response) => {
          if (!response.ok) {
            throw new Error(`Radar request failed (${response.status})`);
          }
          return response.json() as Promise<Data>;
        });
        void promise.catch(() => undefined);
        for (const notify of listeners) notify();
      }

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          controller?.abort();
          controller = undefined;
          promise = pending;
        }
      };
    },
  };
}

export function useNexradData<Mode extends keyof NexradResponses>(
  coordinates: RadarCoordinates,
  mode: Mode,
): Promise<NexradResponses[Mode]> {
  const query = new URLSearchParams({ ...coordinates, mode });
  const url = `/nexrad-layer?${query}`;
  const request = React.useMemo(
    () => createRadarRequest<NexradResponses[Mode]>(url),
    [url],
  );

  return React.useSyncExternalStore(
    request.subscribe,
    request.getSnapshot,
    request.getServerSnapshot,
  );
}
