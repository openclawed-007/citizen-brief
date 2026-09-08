import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BRIEF_MODEL, FALLBACK_MODEL, briefForPatch, notesHash, requestBrief } from "../lib/brief";
import { aiStatusLabel } from "../lib/ai-status";

test("AI provider routing and honest status labels", async () => {
  const originalFetch = globalThis.fetch;
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalRouter = process.env.OPENROUTER_API_KEY;
  process.env.GEMINI_API_KEY = "test-google-key";
  process.env.OPENROUTER_API_KEY = "test-router-key";
  const brief = JSON.stringify({ headline: "Test patch", takeaways: ["A documented fix"] });
  const requests: { url: string; body: Record<string, unknown>; headers: Headers }[] = [];
  let responses: (Response | Error)[] = [];
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) });
    assert.ok(init?.signal, "Every request has a timeout signal");
    const response = responses.shift();
    if (response instanceof Error) throw response;
    assert.ok(response, "No unbounded retries");
    return response;
  };
  const google = () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "hidden reasoning", thought: true }, { text: brief }] } }] });
  const free = () => Response.json({ model: "example/model:free", choices: [{ finish_reason: "stop", message: { content: brief } }] });
  try {
    responses = [google()];
    const primary = await requestBrief("test", "Title", "Notes");
    assert.equal(primary?.model, BRIEF_MODEL);
    assert.equal(primary?.fallback, false);
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /generativelanguage.googleapis.com.*gemini-3.8-flash:generateContent$/);
    assert.equal(requests[0].headers.get("x-goog-api-key"), "test-google-key");
    assert.equal(requests[0].headers.has("authorization"), false);

    for (const failure of [new Response(null, { status: 429 }), new Error("timeout"), Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "invalid" }] } }] }), Response.json({ candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: brief }] } }] })]) {
      requests.length = 0;
      responses = [failure, free()];
      const fallback = await requestBrief("test", "Title", "Notes");
      assert.equal(fallback?.fallback, true);
      assert.equal(fallback?.model, "example/model:free");
      assert.equal(requests.length, 2);
      assert.equal(requests[1].body.model, FALLBACK_MODEL);
      assert.equal(requests[1].headers.has("x-goog-api-key"), false);
    }
    responses = [new Response(null, { status: 503 }), Response.json({ choices: [] })];
    assert.equal(await requestBrief("test", "Title", "Notes"), null);
    process.env.GEMINI_API_KEY = "";
    requests.length = 0;
    responses = [free()];
    assert.equal((await requestBrief("test", "Title", "Notes"))?.fallback, true);
    assert.equal(requests.length, 1);
    process.env.OPENROUTER_API_KEY = "";
    requests.length = 0;
    assert.equal(await requestBrief("test", "Title", "Notes"), null);
    assert.equal(requests.length, 0);

    const status = { checkedAt: "2026-09-08T00:00:00Z", primaryConfigured: true, generated: 0, fallback: 0, failed: 0, cached: 0, models: [] };
    assert.match(aiStatusLabel(), /Not checked/);
    assert.match(aiStatusLabel({ ...status, generated: 1 }), /Gemini working/);
    assert.match(aiStatusLabel({ ...status, generated: 1, fallback: 1 }), /free fallback/);
    assert.match(aiStatusLabel({ ...status, cached: 3 }), /Saved summaries/);
    assert.match(aiStatusLabel({ ...status, cached: 3, failed: 1 }), /unavailable/);
    assert.match(aiStatusLabel({ ...status, generated: 1, failed: 1 }), /Partially/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalGemini === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalGemini;
    if (originalRouter === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalRouter;
  }
});

test("Model migration, cached reads and last-good-summary preservation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "citizen-brief-test-"));
  const cwd = process.cwd();
  const originalFetch = globalThis.fetch;
  const env = { ...process.env };
  const html = `<p>${"Official patch notes. ".repeat(50)}</p>`;
  const old = { headline: "Saved summary", takeaways: ["Existing fact"], newContent: [], fixes: [], knownIssues: [], whoItAffects: [], watchouts: [] };
  try {
    process.chdir(directory);
    await mkdir("data");
    await writeFile("data/briefs.json", JSON.stringify({ test: { hash: notesHash(html), brief: old, model: "old-model", at: "2026-01-01T00:00:00Z" } }));
    process.env.GEMINI_API_KEY = "";
    process.env.OPENROUTER_API_KEY = "";
    process.env.HARVEST = "1";
    assert.deepEqual(await briefForPatch("test", "Title", html), old, "A failed migration keeps the last good summary");
    process.env.GEMINI_API_KEY = "test-key";
    let requests = 0;
    globalThis.fetch = async () => {
      requests += 1;
      return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({ ...old, headline: "Gemini summary" }) }] } }] });
    };
    assert.equal((await briefForPatch("test", "Title", html))?.headline, "Gemini summary");
    assert.equal((await briefForPatch("test", "Title", html))?.headline, "Gemini summary");
    assert.equal(requests, 1, "Unchanged notes are generated only once");
    const stored = JSON.parse(await readFile("data/briefs.json", "utf8"));
    assert.equal(stored.test.model, BRIEF_MODEL);
    Object.assign(process.env, { NODE_ENV: "production" });
    delete process.env.HARVEST;
    await briefForPatch("test", "Title", `${html}<p>New notes</p>`);
    assert.equal(requests, 1, "Static page workers cannot spend more quota");
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of ["GEMINI_API_KEY", "OPENROUTER_API_KEY", "HARVEST", "NODE_ENV"]) {
      if (env[key] === undefined) delete process.env[key];
      else process.env[key] = env[key];
    }
    process.chdir(cwd);
    await rm(directory, { recursive: true, force: true });
  }
});
