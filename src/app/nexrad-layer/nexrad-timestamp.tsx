import React from "react";
import { fetchNexradData } from "./fetch-nexrad";

export function NexradTimestamp(
  props: React.ComponentProps<typeof NexradTimestampRendered>,
) {
  return (
    <React.Suspense name="NexradTimestamp">
      <NexradTimestampRendered {...props} />
    </React.Suspense>
  );
}

async function NexradTimestampRendered({
  offsetMinutes,
  params,
}: {
  offsetMinutes: number;
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const nexradData = await fetchNexradData({ offsetMinutes, params });
  if (!nexradData) return null;

  return (
    <time dateTime={nexradData.timestamp}>
      {new Date(nexradData.timestamp).toLocaleString("en-US", {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        second: "2-digit",
        timeZone: "America/New_York",
        timeZoneName: "short",
      })}
    </time>
  );
}
