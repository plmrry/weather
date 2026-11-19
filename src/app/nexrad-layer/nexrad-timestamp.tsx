import React from "react";
import { LastUpdated } from "#/app/last-updated";
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

  return <LastUpdated timestamp={nexradData.timestamp} />;
}
