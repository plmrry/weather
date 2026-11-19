import type { fetchNexradData } from "./fetch-nexrad";

export type NexradData = Awaited<ReturnType<typeof fetchNexradData>>;
