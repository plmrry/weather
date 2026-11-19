import type {
  fetchNexradDataLatest,
  fetchNexradDataOneHour,
} from "./fetch-nexrad";

export type NexradResponses = {
  hour: Awaited<ReturnType<fetchNexradDataOneHour>>;
  latest: Awaited<ReturnType<fetchNexradDataLatest>>;
};
