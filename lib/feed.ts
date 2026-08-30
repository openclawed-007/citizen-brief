import type {
  Feed,
  LiveVersion,
  NewsArticle,
  PatchArticle,
  PatchSummary,
  RoadmapRelease,
  SourceHealth,
} from "./types";
import { formatDate, versionFromCode } from "./format";
import { extractPatchMeta, plainToHtml, wikiToHtml } from "./wiki";
import {
  fetchCommLink,
  fetchCommLinks,
  fetchGameVersions,
  fetchRoadmapBoard,
  fetchStats,
  fetchStatus,
  fetchWikiWikitext,
  mapCommLink,
  mapCommLinkArticle,
  parseRoadmap,
  pickCoverFromCards,
  wikiPatchTitle,
} from "./sources";

const TTL_MS = 3 * 60 * 1000;

type CacheBox<T> = {
  value: T;
  at: number;
  inflight: Promise<T> | null;
};

let feedBox: CacheBox<Feed> | null = null;
let previousFeed: Feed | null = null;
const patchBox = new Map<string, CacheBox<PatchArticle>>();
const articleBox = new Map<number, CacheBox<NewsArticle>>();

function health(ok: boolean): SourceHealth {
  return ok ? "ok" : "error";
}

function noticeFrom(prev: Feed | null, next: Feed): string | null {
  if (!prev) return null;
  if (prev.live.code !== next.live.code) {
    return `Live environment updated to Star Citizen Alpha ${next.live.version}.`;
  }
  if (prev.roadmap.lastUpdated !== next.roadmap.lastUpdated) {
    return next.roadmap.notificationTitle
      ? `Roadmap updated — ${next.roadmap.notificationTitle}`
      : "The official public roadmap has been updated.";
  }
  if (prev.news[0]?.id !== next.news[0]?.id && next.news[0]) {
    return `New official post: ${next.news[0].title}`;
  }
  if (prev.status.summary !== next.status.summary) {
    return `RSI service status is now ${next.status.summary}.`;
  }
  return null;
}

function fingerprint(parts: (string | number | null | undefined)[]): string {
  return parts.map((p) => String(p ?? "")).join("|");
}

function sortReleases(releases: RoadmapRelease[]): RoadmapRelease[] {
  const numbered = releases.filter((r) => /^\d+(\.\d+)*$/.test(r.name));
  numbered.sort((a, b) => {
    const av = a.name.split(".").map(Number);
    const bv = b.name.split(".").map(Number);
    const len = Math.max(av.length, bv.length);
    for (let i = 0; i < len; i += 1) {
      const d = (av[i] || 0) - (bv[i] || 0);
      if (d) return d;
    }
    return 0;
  });
  return numbered;
}

function matchRelease(releases: RoadmapRelease[], version: string): RoadmapRelease | null {
  const exact = releases.find((r) => r.name === version);
  if (exact) return exact;
  const major = version.replace(/\.0$/, "");
  return releases.find((r) => r.name === major || version.startsWith(r.name + ".")) || null;
}

async function settled<T>(p: Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
  try {
    return { ok: true, value: await p };
  } catch (error) {
    return { ok: false, error };
  }
}

async function buildFeed(): Promise<Feed> {
  const [versionsRes, commRes, roadmapRes, statusRes, statsRes] = await Promise.all([
    settled(fetchGameVersions()),
    settled(fetchCommLinks(40)),
    settled(fetchRoadmapBoard()),
    settled(fetchStatus()),
    settled(fetchStats()),
  ]);

  const versions = versionsRes.ok ? versionsRes.value : [];
  const commRaw = commRes.ok ? commRes.value : [];

  // Versions and comm-links drive every generated route. A partial snapshot would
  // publish dead links or erase known-good content, so fail the harvest and let the
  // host keep serving the previous successful deployment instead.
  if (!versionsRes.ok || versions.length === 0) {
    throw new Error("Cannot publish without a valid game-version snapshot");
  }
  if (!commRes.ok || commRaw.length === 0) {
    throw new Error("Cannot publish without a valid comm-link snapshot");
  }

  const news = commRaw.map(mapCommLink);
  const liveRow = versions.find((v) => v.is_default) || versions[0];
  const liveVersion = liveRow ? versionFromCode(liveRow.code) : "—";

  const roadmapParsed = roadmapRes.ok ? parseRoadmap(roadmapRes.value) : null;
  const numbered = roadmapParsed ? sortReleases(roadmapParsed.releases) : [];
  const current = roadmapParsed ? matchRelease(numbered, liveVersion) : null;
  const currentIdx = current ? numbered.findIndex((r) => r.id === current.id) : -1;
  const upcoming = currentIdx >= 0 ? numbered.slice(currentIdx + 1) : numbered.slice(-2);
  const horizon =
    roadmapParsed?.releases.find((r) => /star citizen 1\.0/i.test(r.name)) || null;

  const wikiTitle = liveRow ? wikiPatchTitle(liveVersion) : "";
  const wikiRes = wikiTitle ? await settled(fetchWikiWikitext(wikiTitle)) : { ok: false as const, error: "skip" };
  const wikitext = wikiRes.ok ? wikiRes.value : null;
  const meta = wikitext ? extractPatchMeta(wikitext) : null;

  const liveTitle =
    meta?.headline ||
    current?.cards.find((c) => /siege|headline|operation/i.test(c.name))?.name ||
    (liveVersion !== "—" ? `Star Citizen Alpha ${liveVersion}` : "Star Citizen");

  const live: LiveVersion = {
    version: liveVersion,
    build: meta?.build || liveRow?.code || "",
    code: liveRow?.code || "",
    channel: liveRow?.channel || "live",
    releasedAt: liveRow?.released_at || meta?.publishDate || null,
    title: liveTitle.replace(/^Star Citizen Alpha [0-9.]+\s*[—–-]\s*/i, "") || liveTitle,
    summary:
      meta?.summary ||
      current?.cards[0]?.description ||
      "Official live-environment briefing pulled from Cloud Imperium sources.",
    image: pickCoverFromCards(current?.cards || [], "siege|orison|instancing") || news.find((n) => n.image)?.image || null,
    rsiPatchUrl: meta?.rsiPatchUrl || news.find((n) => n.kind === "patch")?.url || null,
    rsiAnnounceUrl: meta?.rsiAnnounceUrl || null,
    wikiUrl: liveRow ? `https://starcitizen.tools/${wikiTitle.replace(/ /g, "_")}` : null,
  };

  const statusJson = statusRes.ok ? (statusRes.value as { summaryStatus?: string; systems?: { name: string; status: string }[] }) : null;
  const statsJson = statsRes.ok
    ? (statsRes.value as { data?: { fans?: number; funds?: number } })
    : null;

  const seenVersions = new Set<string>();
  const patches: PatchSummary[] = [];
  for (const v of versions) {
    const version = versionFromCode(v.code);
    if (seenVersions.has(version)) continue;
    seenVersions.add(version);
    patches.push({
      version,
      build: v.code,
      code: v.code,
      channel: v.channel,
      releasedAt: v.released_at,
      isLive: Boolean(v.is_default),
      title:
        v.is_default && live.title
          ? `Alpha ${version} — ${live.title.replace(/"/g, "")}`
          : `Star Citizen Alpha ${version}`,
      wikiUrl: `https://starcitizen.tools/${wikiPatchTitle(version).replace(/ /g, "_")}`,
      rsiUrl: null,
    });
  }

  const feed: Feed = {
    fetchedAt: new Date().toISOString(),
    fingerprint: fingerprint([
      live.code,
      news[0]?.id,
      roadmapParsed?.lastUpdated,
      statusJson?.summaryStatus,
      statsJson?.data?.funds,
    ]),
    notice: null,
    live,
    status: {
      summary: statusJson?.summaryStatus || "unknown",
      systems: (statusJson?.systems || []).map((s) => ({ name: s.name, status: s.status })),
      sourceUrl: "https://status.robertsspaceindustries.com",
    },
    stats: {
      citizens: statsJson?.data?.fans ?? null,
      fundsUsd: statsJson?.data?.funds ?? null,
    },
    news,
    patches,
    roadmap: {
      liveVersionLabel: roadmapParsed?.liveVersionLabel || `Live Version: ${live.version}`,
      lastUpdated: roadmapParsed?.lastUpdated || null,
      lastUpdatedIso: roadmapParsed?.lastUpdated
        ? new Date(roadmapParsed.lastUpdated * 1000).toISOString()
        : null,
      notificationTitle: roadmapParsed?.notificationTitle || "",
      notificationBody: roadmapParsed?.notificationBody || "",
      notificationUrl: roadmapParsed?.notificationUrl || null,
      officialUrl: "https://robertsspaceindustries.com/roadmap/release-view",
      current,
      upcoming,
      horizon,
      releases: numbered.concat(horizon ? [horizon] : []),
      categories: roadmapParsed?.categories.map((c) => c.name) || [],
    },
    sources: {
      wikiCommLinks: health(commRes.ok),
      wikiVersions: health(versionsRes.ok),
      wikiPatch: health(Boolean(wikitext)),
      rsiRoadmap: health(roadmapRes.ok),
      rsiStatus: health(statusRes.ok),
      rsiStats: health(statsRes.ok),
    },
  };

  feed.notice = noticeFrom(previousFeed, feed);
  previousFeed = feed;
  return feed;
}

export async function getFeed(force = false): Promise<Feed> {
  const now = Date.now();
  if (!force && feedBox && now - feedBox.at < TTL_MS) return feedBox.value;
  if (!force && feedBox?.inflight) return feedBox.value;
  const job = buildFeed();
  if (feedBox && !force) {
    feedBox.inflight = job;
    job
      .then((value) => {
        feedBox = { value, at: Date.now(), inflight: null };
      })
      .catch(() => {
        if (feedBox) feedBox.inflight = null;
      });
    return feedBox.value;
  }
  const value = await job;
  feedBox = { value, at: Date.now(), inflight: null };
  return value;
}

export async function getPatchArticle(version: string): Promise<PatchArticle> {
  const key = version.trim();
  const cached = patchBox.get(key);
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) return cached.value;

  const feed = await getFeed();
  const summary = feed.patches.find((p) => p.version === key);
  const release = feed.roadmap.releases.find(
    (r) => r.name === key || key.startsWith(r.name + ".") || r.name === key.replace(/\.0$/, ""),
  );
  const wikitext = await fetchWikiWikitext(wikiPatchTitle(key));
  const meta = wikitext ? extractPatchMeta(wikitext) : null;
  const html = wikitext ? wikiToHtml(wikitext) : "";

  let source: PatchArticle["source"] = "roadmap";
  let bodyHtml = html;
  if (html && html.length > 80) source = "wiki";
  else {
    const comm = feed.news.find(
      (n) => n.kind === "patch" && new RegExp(key.replace(/\.0$/, ""), "i").test(n.title),
    );
    if (comm) {
      const full = await fetchCommLink(comm.id);
      if (full?.translations?.en_EN) {
        bodyHtml = plainToHtml(full.translations.en_EN);
        source = "comm-link";
      }
    }
  }

  const article: PatchArticle = {
    version: key,
    build: meta?.build || summary?.build || "",
    code: summary?.code || meta?.build || "",
    channel: summary?.channel || "live",
    releasedAt: summary?.releasedAt || meta?.publishDate || null,
    isLive: summary?.isLive || feed.live.version === key,
    title:
      meta?.headline ||
      (release ? `Alpha ${release.name}` : `Star Citizen Alpha ${key}`),
    wikiUrl: `https://starcitizen.tools/${wikiPatchTitle(key).replace(/ /g, "_")}`,
    rsiUrl: meta?.rsiPatchUrl || summary?.rsiUrl || feed.live.rsiPatchUrl,
    html:
      bodyHtml ||
      `<p>Full patch notes for Alpha ${key} are published on the RSI comm-link and the Star Citizen Wiki as soon as Cloud Imperium releases them. This page updates automatically.</p>`,
    summary: meta?.summary || release?.cards[0]?.description || "",
    prev: meta?.prev ? meta.prev.replace(/^Star Citizen Alpha\s+/i, "") : null,
    next: meta?.next ? meta.next.replace(/^Star Citizen Alpha\s+/i, "") : null,
    publishDate: meta?.publishDate || (summary?.releasedAt ? formatDate(summary.releasedAt) : null),
    cards: release?.cards || [],
    source,
  };

  patchBox.set(key, { value: article, at: Date.now(), inflight: null });
  return article;
}

export async function getNewsArticle(id: number): Promise<NewsArticle | null> {
  const cached = articleBox.get(id);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const raw = await fetchCommLink(id);
  if (!raw) return null;
  const mapped = mapCommLinkArticle(raw);
  const article: NewsArticle = {
    ...mapped,
    html: plainToHtml(mapped.body),
  };
  articleBox.set(id, { value: article, at: Date.now(), inflight: null });
  return article;
}

export function toPublicFeed(feed: Feed): Feed {
  return {
    ...feed,
    roadmap: {
      ...feed.roadmap,
      upcoming: feed.roadmap.upcoming.slice(0, 2),
      // current/upcoming/horizon already carry these cards. Avoid serializing a
      // second copy into every HTML page and feed refresh.
      releases: [],
    },
  };
}

export function emptyFeed(): Feed {
  return {
    fetchedAt: new Date().toISOString(),
    fingerprint: "empty",
    notice: "Official sources are temporarily unreachable.",
    live: {
      version: "—",
      build: "",
      code: "",
      channel: "live",
      releasedAt: null,
      title: "Signal lost",
      summary: "The briefing desk could not reach RSI or the Star Citizen Wiki just now. It will retry automatically.",
      image: null,
      rsiPatchUrl: null,
      rsiAnnounceUrl: null,
      wikiUrl: null,
    },
    status: { summary: "unknown", systems: [], sourceUrl: "https://status.robertsspaceindustries.com" },
    stats: { citizens: null, fundsUsd: null },
    news: [],
    patches: [],
    roadmap: {
      liveVersionLabel: "",
      lastUpdated: null,
      lastUpdatedIso: null,
      notificationTitle: "",
      notificationBody: "",
      notificationUrl: null,
      officialUrl: "https://robertsspaceindustries.com/roadmap/release-view",
      current: null,
      upcoming: [],
      horizon: null,
      releases: [],
      categories: [],
    },
    sources: {
      wikiCommLinks: "error",
      wikiVersions: "error",
      wikiPatch: "error",
      rsiRoadmap: "error",
      rsiStatus: "error",
      rsiStats: "error",
    },
  };
}
