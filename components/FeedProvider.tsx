"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Feed, NewsItem, PatchSummary } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import { BASE_PATH } from "@/lib/paths";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const MAX_BACKOFF_MS = 60 * 60 * 1000;

type Ctx = {
  feed: Feed;
  notice: string | null;
  dismiss: () => void;
  refreshing: boolean;
  checkedAt: string;
  refresh: () => Promise<void>;
  newsHref: (item: Pick<NewsItem, "id" | "url">) => string;
  patchHref: (patch: Pick<PatchSummary, "version" | "wikiUrl">) => string;
};

const FeedContext = createContext<Ctx | null>(null);

function isFeed(value: unknown): value is Feed {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Feed>;
  return (
    typeof candidate.fingerprint === "string" &&
    typeof candidate.fetchedAt === "string" &&
    Array.isArray(candidate.news) &&
    Array.isArray(candidate.patches) &&
    Boolean(candidate.live && candidate.roadmap && candidate.status)
  );
}

export function FeedProvider({
  initial,
  children,
}: {
  initial: Feed;
  children: React.ReactNode;
}) {
  const [feed, setFeed] = useState(initial);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedAt, setCheckedAt] = useState(initial.fetchedAt);
  const feedRef = useRef(feed);
  const refreshingRef = useRef(false);
  const initialFetchedAt = Date.parse(initial.fetchedAt);
  const lastCheckedRef = useRef(Number.isNaN(initialFetchedAt) ? 0 : initialFetchedAt);
  const failuresRef = useRef(0);
  const newsRoutesRef = useRef(new Set(initial.news.map((item) => item.id)));
  const patchRoutesRef = useRef(new Set(initial.patches.map((patch) => patch.version)));

  useEffect(() => {
    feedRef.current = feed;
  }, [feed]);

  const apply = useCallback((next: Feed) => {
    setFeed((prev) => {
      if (prev.fingerprint !== next.fingerprint) {
        if (prev.live.code !== next.live.code) {
          setNotice(`Live environment updated to Star Citizen Alpha ${next.live.version}.`);
        } else if (prev.news[0]?.id !== next.news[0]?.id && next.news[0]) {
          setNotice(`New official post: ${next.news[0].title}`);
        } else if (prev.roadmap.lastUpdated !== next.roadmap.lastUpdated) {
          setNotice(
            next.roadmap.notificationTitle
              ? `Roadmap updated — ${next.roadmap.notificationTitle}`
              : "The official public roadmap has been updated.",
          );
        } else if (next.notice) {
          setNotice(next.notice);
        }
      }
      return next;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("cb-fp", next.fingerprint);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      // Visitors only revalidate our deployed snapshot. Upstream RSI/Wiki APIs are
      // contacted once by the scheduled harvest, never once per open browser tab.
      const response = await fetch(`${BASE_PATH}/feed.json`, {
        cache: "no-cache",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Feed check failed (${response.status})`);
      const next: unknown = await response.json();
      if (!isFeed(next)) throw new Error("Feed check returned an invalid snapshot");

      newsRoutesRef.current = new Set(next.news.map((item) => item.id));
      patchRoutesRef.current = new Set(next.patches.map((patch) => patch.version));
      failuresRef.current = 0;
      setCheckedAt(new Date().toISOString());
      if (next.fingerprint !== feedRef.current.fingerprint) apply(next);
    } catch {
      failuresRef.current += 1;
    } finally {
      lastCheckedRef.current = Date.now();
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [apply]);

  useEffect(() => {
    const checkIfStale = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      const backoff = Math.min(
        CHECK_INTERVAL_MS * 2 ** failuresRef.current,
        MAX_BACKOFF_MS,
      );
      if (Date.now() - lastCheckedRef.current >= backoff) {
        refresh().catch(() => undefined);
      }
    };
    const id = window.setInterval(checkIfStale, 30_000);
    checkIfStale();
    window.addEventListener("visibilitychange", checkIfStale);
    window.addEventListener("online", checkIfStale);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", checkIfStale);
      window.removeEventListener("online", checkIfStale);
    };
  }, [refresh]);

  const newsHref = useCallback(
    (item: Pick<NewsItem, "id" | "url">) =>
      newsRoutesRef.current.has(item.id) ? `/news/${item.id}` : item.url,
    [],
  );
  const patchHref = useCallback(
    (patch: Pick<PatchSummary, "version" | "wikiUrl">) =>
      patchRoutesRef.current.has(patch.version) ? `/patches/${patch.version}` : patch.wikiUrl,
    [],
  );

  const value = useMemo(
    () => ({
      feed,
      notice,
      dismiss: () => setNotice(null),
      refreshing,
      checkedAt,
      refresh,
      newsHref,
      patchHref,
    }),
    [feed, notice, refreshing, checkedAt, refresh, newsHref, patchHref],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}

export function useSyncedLabel() {
  const { checkedAt, refreshing } = useFeed();
  if (refreshing) return "Checking for updates…";
  return `Checked ${relativeTime(checkedAt)}`;
}
