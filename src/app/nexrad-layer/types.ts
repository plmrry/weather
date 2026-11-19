import type {
  fetchNexradDataLatest,
  fetchNexradDataOneHour,
} from "./fetch-nexrad";

export type NexradResponses = {
  hour: Awaited<ReturnType<typeof fetchNexradDataOneHour>>;
  latest: Awaited<ReturnType<typeof fetchNexradDataLatest>>;
};
