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
import type { Feed } from "@/lib/types";
import { relativeTime, versionFromCode } from "@/lib/format";
import { BASE_PATH } from "@/lib/paths";
import { fetchCommLinks, fetchGameVersions, mapCommLink } from "@/lib/sources";

type Ctx = {
  feed: Feed;
  notice: string | null;
  dismiss: () => void;
  refreshing: boolean;
  refresh: () => Promise<void>;
};

const FeedContext = createContext<Ctx | null>(null);

function mergeLive(base: Feed, overlay: Partial<Feed>): Feed {
  const next: Feed = { ...base, ...overlay, live: { ...base.live, ...(overlay.live || {}) } };
  next.fingerprint = [
    next.live.code,
    next.news[0]?.id,
    next.roadmap.lastUpdated,
    next.status.summary,
  ].join("|");
  return next;
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
  const feedRef = useRef(feed);
  feedRef.current = feed;

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
    setRefreshing(true);
    try {
      const [baked, versions, comms] = await Promise.all([
        fetch(`${BASE_PATH}/feed.json?t=${Date.now()}`, { cache: "no-store" })
          .then((r) => (r.ok ? (r.json() as Promise<Feed>) : null))
          .catch(() => null),
        fetchGameVersions().catch(() => null),
        fetchCommLinks(40).catch(() => null),
      ]);

      let next = baked || feedRef.current;
      if (comms && comms.length) {
        next = mergeLive(next, { news: comms.map(mapCommLink), fetchedAt: new Date().toISOString() });
      }
      if (versions && versions.length) {
        const liveRow = versions.find((v) => v.is_default) || versions[0];
        next = mergeLive(next, {
          live: {
            ...next.live,
            version: versionFromCode(liveRow.code),
            build: liveRow.code,
            code: liveRow.code,
            channel: liveRow.channel,
            releasedAt: liveRow.released_at,
          },
          patches: versions.map((v) => ({
            version: versionFromCode(v.code),
            build: v.code,
            code: v.code,
            channel: v.channel,
            releasedAt: v.released_at,
            isLive: Boolean(v.is_default),
            title: `Star Citizen Alpha ${versionFromCode(v.code)}`,
            wikiUrl: `https://starcitizen.tools/Update:Star_Citizen_Alpha_${versionFromCode(v.code)}`.replace(
              / /g,
              "_",
            ),
            rsiUrl: null,
          })),
          fetchedAt: new Date().toISOString(),
        });
      }
      apply(next);
    } finally {
      setRefreshing(false);
    }
  }, [apply]);

  useEffect(() => {
    apply(initial);
  }, [initial, apply]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refresh().catch(() => undefined);
    }, 60_000);
    const onFocus = () => {
      refresh().catch(() => undefined);
    };
    window.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      feed,
      notice,
      dismiss: () => setNotice(null),
      refreshing,
      refresh,
    }),
    [feed, notice, refreshing, refresh],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}

export function useSyncedLabel() {
  const { feed, refreshing } = useFeed();
  if (refreshing) return "Checking official sources…";
  return `Updated ${relativeTime(feed.fetchedAt)}`;
}
