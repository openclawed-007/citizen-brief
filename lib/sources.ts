import type { NewsKind, NewsItem, RoadmapCard, RoadmapRelease } from "./types";
import { excerpt, rsiMedia, versionFromCode } from "./format";

export const UA =
  "CitizenBrief/1.0 (+https://github.com; unofficial Star Citizen briefing)";

const WIKI = "https://api.star-citizen.wiki";
const TOOLS = "https://starcitizen.tools/api.php";
const RSI = "https://robertsspaceindustries.com";
const STATUS = "https://status.robertsspaceindustries.com/index.json";

async function pull(
  url: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json, text/plain, */*");
  }
  if (typeof window === "undefined" && !headers.has("User-Agent")) {
    headers.set("User-Agent", UA);
  }
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers,
    signal: init.signal || AbortSignal.timeout(12_000),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json, text };
}

export async function fetchGameVersions(): Promise<
  {
    code: string;
    channel: string;
    released_at: string | null;
    is_default: boolean;
  }[]
> {
  const { ok, json } = await pull(`${WIKI}/api/game-versions`);
  if (!ok || !json || typeof json !== "object") throw new Error("game-versions failed");
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as { code: string; channel: string; released_at: string | null; is_default: boolean }[]) : [];
}

type RawCommLink = {
  id: number;
  title: string;
  rsi_url: string;
  api_url: string;
  channel?: string;
  category?: string;
  series?: string;
  created_at?: string;
  images_count?: number;
  images?: {
    rsi_url?: string;
    alt?: string;
    name?: string;
    size?: number;
    mime_type?: string;
  }[];
  translations?: Record<string, string>;
};

export async function fetchCommLinks(size = 36): Promise<RawCommLink[]> {
  const url = `${WIKI}/api/comm-links?page%5Bsize%5D=${size}&include=images`;
  const { ok, json } = await pull(url);
  if (!ok || !json || typeof json !== "object") throw new Error("comm-links failed");
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as RawCommLink[]) : [];
}

export async function fetchCommLink(id: number): Promise<RawCommLink | null> {
  const { ok, json } = await pull(`${WIKI}/api/comm-links/${id}?include=images`);
  if (!ok || !json || typeof json !== "object") return null;
  const data = (json as { data?: RawCommLink }).data;
  return data || null;
}

export async function fetchWikiWikitext(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "wikitext",
    format: "json",
    redirects: "1",
    origin: "*",
  });
  const { ok, json } = await pull(`${TOOLS}?${params.toString()}`);
  if (!ok || !json || typeof json !== "object") return null;
  const parse = (json as { parse?: { wikitext?: { "*": string } | string } }).parse;
  if (!parse) return null;
  const wt = parse.wikitext;
  if (typeof wt === "string") return wt;
  return wt?.["*"] || null;
}

export async function fetchRoadmapBoard(): Promise<unknown> {
  const { ok, json } = await pull(`${RSI}/api/roadmap/v1/boards/1`, {
    headers: {
      Referer: "https://robertsspaceindustries.com/roadmap/release-view",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!ok) throw new Error("roadmap failed");
  return json;
}

export async function fetchStatus(): Promise<unknown> {
  const { ok, json } = await pull(STATUS);
  if (!ok) throw new Error("status failed");
  return json;
}

export async function fetchStats(): Promise<unknown> {
  const { ok, json } = await pull(`${RSI}/api/stats/getCrowdfundStats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://robertsspaceindustries.com/",
    },
    body: JSON.stringify({ fans: 1, funds: 1, alpha_slots: 1 }),
  });
  if (!ok) throw new Error("stats failed");
  return json;
}

export function classifyNews(item: {
  title: string;
  series?: string;
  channel?: string;
  category?: string;
}): NewsKind {
  const title = item.title || "";
  const series = item.series || "";
  if (/roadmap/i.test(title) || /roadmap/i.test(series)) return "roadmap";
  if (/release info/i.test(series) || /^star citizen alpha\s+\d/i.test(title)) return "patch";
  if (/this week in star citizen/i.test(title)) return "weekly";
  if (/monthly report/i.test(title)) return "monthly";
  if (/chairman/i.test(title) || /from the chairman/i.test(series)) return "chairman";
  if (/behind the ships/i.test(title)) return "ship";
  if (/transmission/i.test(item.channel || "")) return "transmission";
  return "official";
}

function pickCover(
  images: RawCommLink["images"],
): string | null {
  if (!images?.length) return null;
  const ranked = [...images].sort((a, b) => (b.size || 0) - (a.size || 0));
  const good = ranked.find((img) => {
    const name = (img.name || "").toLowerCase();
    if (/divid|line|icon|logo-small|spacer|pixel/.test(name)) return false;
    return (img.size || 0) > 40_000;
  });
  return rsiMedia((good || ranked[0])?.rsi_url);
}

export function mapCommLink(raw: RawCommLink): NewsItem {
  const body = raw.translations?.en_EN || "";
  return {
    id: raw.id,
    title: raw.title,
    kind: classifyNews(raw),
    channel: raw.channel || "",
    category: raw.category || "",
    series: raw.series || "",
    publishedAt: raw.created_at || null,
    url: raw.rsi_url,
    apiUrl: raw.api_url,
    excerpt: excerpt(body.replace(/^[A-Z][A-Z0-9 .,:;-]{7,80}\n/, ""), 240),
    image: pickCover(raw.images),
    imageCount: raw.images_count || raw.images?.length || 0,
  };
}

export function mapCommLinkArticle(raw: RawCommLink): NewsItem & { body: string; images: { url: string; alt: string; name: string }[] } {
  const item = mapCommLink(raw);
  return {
    ...item,
    body: raw.translations?.en_EN || "",
    images: (raw.images || [])
      .map((img) => ({
        url: rsiMedia(img.rsi_url) || "",
        alt: img.alt || raw.title,
        name: img.name || "",
      }))
      .filter((img) => img.url),
  };
}

type RawCard = {
  id: number;
  url_slug: string;
  name: string;
  status?: string;
  category_id?: number;
  description?: string;
  body?: string;
  thumbnail?: { urls?: Record<string, string> };
  release_id?: number;
};

type RawRelease = {
  id: number;
  name: string;
  status?: string;
  released?: number | boolean;
  order?: number;
  cards?: RawCard[];
};

export function parseRoadmap(payload: unknown): {
  liveVersionLabel: string;
  lastUpdated: number | null;
  notificationTitle: string;
  notificationBody: string;
  notificationUrl: string | null;
  categories: { id: number; name: string }[];
  releases: RoadmapRelease[];
} {
  const root = payload as { data?: Record<string, unknown> };
  const data = root?.data || {};
  const categories = Array.isArray(data.categories)
    ? (data.categories as { id: number; name: string }[])
    : [];
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  const notificationBody = String(data.notification_body || "");
  const urlMatch = notificationBody.match(/\((https?:\/\/[^)]+)\)/);

  const releases: RoadmapRelease[] = (Array.isArray(data.releases) ? data.releases : []).map(
    (rel: RawRelease) => ({
      id: rel.id,
      name: rel.name,
      status: rel.status || (rel.released ? "Released" : "Scheduled"),
      released: Boolean(rel.released) || /released/i.test(rel.status || ""),
      order: rel.order || 0,
      cards: (rel.cards || []).map((card) => ({
        id: card.id,
        name: card.name,
        slug: card.url_slug,
        status: card.status || "Unknown",
        category: catMap.get(card.category_id || -1) || "General",
        description: (card.description || card.body || "").replace(/\s+/g, " ").trim(),
        image: rsiMedia(card.thumbnail?.urls?.rect || card.thumbnail?.urls?.large || card.thumbnail?.urls?.source || null),
        release: rel.name,
        url: `https://robertsspaceindustries.com/roadmap/release-view`,
      })),
    }),
  );

  return {
    liveVersionLabel: String(data.description || ""),
    lastUpdated: typeof data.last_updated === "number" ? data.last_updated : null,
    notificationTitle: String(data.notification_title || ""),
    notificationBody,
    notificationUrl: urlMatch?.[1] || null,
    categories,
    releases,
  };
}

export function pickCoverFromCards(cards: RoadmapCard[], prefer?: string): string | null {
  if (prefer) {
    const hit = cards.find((c) => c.image && new RegExp(prefer, "i").test(c.name));
    if (hit?.image) return hit.image;
  }
  return cards.find((c) => c.image)?.image || null;
}

export function officialPatchUrl(version: string, commLinks: NewsItem[]): string | null {
  const compact = version.replace(/\.0$/, "");
  const hit = commLinks.find((n) => {
    if (n.kind !== "patch" && n.kind !== "official") return false;
    return new RegExp(`alpha\\s+${compact.replace(".", "\\.")}\\b`, "i").test(n.title);
  });
  if (hit) return hit.url;
  const slug = version.replace(/\./g, "");
  return `${RSI}/comm-link/Patch-Notes/Star-Citizen-Alpha-${slug}`;
}

export function wikiPatchTitle(version: string): string {
  return `Update:Star Citizen Alpha ${version}`;
}

export { versionFromCode };
