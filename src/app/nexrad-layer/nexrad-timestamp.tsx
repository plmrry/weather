import { fetchNexradData } from "./fetch-nexrad";

export async function NexradTimestamp({
  offsetMinutes,
  params,
}: {
  offsetMinutes: number;
  params?: PageProps<"/latitude/[latitude]/longitude/[longitude]">["params"];
}) {
  if (!params) return null;

  const data = await fetchNexradData({ offsetMinutes, params });
  if (!data) return null;

  return (
    <time dateTime={data.timestamp}>
      {new Date(data.timestamp).toLocaleString("en-US", {
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
