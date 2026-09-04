export type SourceHealth = "ok" | "error" | "stale";

export type LiveVersion = {
  version: string;
  build: string;
  code: string;
  channel: string;
  releasedAt: string | null;
  title: string;
  summary: string;
  image: string | null;
  rsiPatchUrl: string | null;
  rsiAnnounceUrl: string | null;
  wikiUrl: string | null;
};

export type ServiceStatus = {
  name: string;
  status: string;
};

export type StatusSnapshot = {
  summary: string;
  systems: ServiceStatus[];
  sourceUrl: string;
};

export type StatsSnapshot = {
  citizens: number | null;
  fundsUsd: number | null;
};

export type NewsItem = {
  id: number;
  title: string;
  kind: NewsKind;
  channel: string;
  category: string;
  series: string;
  publishedAt: string | null;
  url: string;
  apiUrl: string;
  excerpt: string;
  image: string | null;
  imageCount: number;
};

export type NewsKind =
  | "patch"
  | "roadmap"
  | "weekly"
  | "monthly"
  | "chairman"
  | "transmission"
  | "ship"
  | "official";

export type NewsArticle = NewsItem & {
  body: string;
  html: string;
  images: { url: string; alt: string; name: string }[];
};

export type RoadmapCard = {
  id: number;
  name: string;
  slug: string;
  status: string;
  category: string;
  description: string;
  image: string | null;
  release: string;
  url: string;
};

export type RoadmapRelease = {
  id: number;
  name: string;
  status: string;
  released: boolean;
  order: number;
  cards: RoadmapCard[];
};

export type RoadmapSnapshot = {
  liveVersionLabel: string;
  lastUpdated: number | null;
  lastUpdatedIso: string | null;
  notificationTitle: string;
  notificationBody: string;
  notificationUrl: string | null;
  officialUrl: string;
  current: RoadmapRelease | null;
  upcoming: RoadmapRelease[];
  horizon: RoadmapRelease | null;
  releases: RoadmapRelease[];
  categories: string[];
};

export type PatchSummary = {
  version: string;
  build: string;
  code: string;
  channel: string;
  releasedAt: string | null;
  isLive: boolean;
  title: string;
  wikiUrl: string;
  rsiUrl: string | null;
};

export type BriefItem = {
  title: string;
  detail: string;
};

export type PatchBrief = {
  headline: string;
  takeaways: string[];
  newContent: BriefItem[];
  fixes: BriefItem[];
  knownIssues: BriefItem[];
  whoItAffects: string[];
  watchouts: string[];
};

export type PatchArticle = PatchSummary & {
  html: string;
  summary: string;
  prev: string | null;
  next: string | null;
  publishDate: string | null;
  cards: RoadmapCard[];
  source: "wiki" | "comm-link" | "roadmap";
  brief: PatchBrief | null;
  wantsBrief: boolean;
};

export type Feed = {
  fetchedAt: string;
  fingerprint: string;
  notice: string | null;
  live: LiveVersion;
  status: StatusSnapshot;
  stats: StatsSnapshot;
  news: NewsItem[];
  patches: PatchSummary[];
  roadmap: RoadmapSnapshot;
  sources: {
    wikiCommLinks: SourceHealth;
    wikiVersions: SourceHealth;
    wikiPatch: SourceHealth;
    rsiRoadmap: SourceHealth;
    rsiStatus: SourceHealth;
    rsiStats: SourceHealth;
  };
};

export type PatchListResponse = {
  fetchedAt: string;
  patches: PatchSummary[];
};
