import type { AiStatus } from "./types";

export function briefAuthor(model: string): string {
  if (model === "assistant-written") return "Assistant-written";
  if (model === "gemini-3.8-flash") return "Gemini 3.8 Flash";
  return model;
}

export function aiStatusLabel(status?: AiStatus): string {
  if (!status) return "AI · Not checked yet";
  if (status.failed) return status.generated ? "AI · Partially available" : "AI · Processing unavailable";
  if (status.fallback) return "AI · Working via free fallback";
  if (status.generated) return "AI · Gemini working";
  if (status.cached) return "AI · Saved summaries ready";
  return "AI · No notes to process";
}
