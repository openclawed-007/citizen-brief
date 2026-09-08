import type { AiStatus } from "./types";

export function aiStatusLabel(status?: AiStatus): string {
  if (!status) return "AI · Not checked yet";
  if (status.failed) return status.generated ? "AI · Partially available" : "AI · Processing unavailable";
  if (status.fallback) return "AI · Working via free fallback";
  if (status.generated) return "AI · Gemini working";
  if (status.cached) return "AI · Saved summaries ready";
  return "AI · No notes to process";
}
