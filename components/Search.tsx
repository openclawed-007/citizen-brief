"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useFeed } from "./FeedProvider";
import { kindLabel } from "@/lib/format";
import { rankSearch, type SearchCandidate } from "@/lib/search";

type Hit = SearchCandidate & {
  href: string;
  kicker: string;
  blurb: string;
};

function SearchDialog({ onClose }: { onClose: () => void }) {
  const { feed, newsHref, patchHref } = useFeed();
  const { current: currentRelease, upcoming, horizon } = feed.roadmap;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const candidates = useMemo(() => {
    const candidates: Hit[] = [];
    feed.patches.forEach((patch, index) => {
      candidates.push({
        href: patchHref(patch),
        kicker: patch.isLive ? "Live patch" : "Patch notes",
        title: patch.title,
        blurb: patch.build || `Alpha ${patch.version}`,
        searchText: `${patch.version} ${patch.build} ${patch.channel}`,
        keywords: "patch update build release hotfix notes live alpha",
        priority: patch.isLive ? 55 : Math.max(12 - index, 1),
      });
    });

    const roadmapReleases = [
      ...(currentRelease ? [currentRelease] : []),
      ...upcoming,
      ...(horizon ? [horizon] : []),
    ].filter((release, index, list) => list.findIndex((item) => item.id === release.id) === index);
    roadmapReleases.forEach((release, releaseIndex) => {
      release.cards.forEach((card) => {
        candidates.push({
          href: "/roadmap",
          kicker: `Roadmap · ${release.name === "Star Citizen 1.0" ? release.name : `Alpha ${release.name}`}`,
          title: card.name,
          blurb: card.description.slice(0, 140),
          searchText: `${card.category} ${card.description} ${release.name} ${card.status}`,
          keywords: "roadmap upcoming next planned future feature deliverable",
          priority: Math.max(18 - releaseIndex * 4, 5),
        });
      });
    });

    feed.news.forEach((item, index) => {
      candidates.push({
        href: newsHref(item),
        kicker: kindLabel(item.kind),
        title: item.title,
        blurb: item.excerpt.slice(0, 140),
        searchText: `${item.excerpt} ${item.kind} ${item.series} ${item.category} ${item.channel}`,
        keywords: "news latest official announcement commlink transmission",
        priority: Math.max(42 - index, 3),
      });
    });

    candidates.push({
      href: feed.status.sourceUrl,
      kicker: "Live service",
      title: `Universe status: ${feed.status.summary}`,
      blurb: feed.status.systems.map((system) => `${system.name}: ${system.status}`).join(" · "),
      searchText: `${feed.status.summary} ${feed.status.systems.map((system) => `${system.name} ${system.status}`).join(" ")}`,
      keywords: "server status universe outage maintenance service platform online",
      priority: 30,
    });

    return candidates;
  }, [feed.patches, currentRelease, upcoming, horizon, feed.news, feed.status, newsHref, patchHref]);
  const hits = useMemo(() => rankSearch(candidates, q), [candidates, q]);
  const selected = Math.min(active, Math.max(hits.length - 1, 0));

  useEffect(() => {
    document.getElementById(`search-result-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected, q]);

  const go = (href: string) => {
    onClose();
    if (/^https?:\/\//.test(href)) window.location.assign(href);
    else router.push(href);
  };

  return (
    <Modal className="search-back" label="Search the briefing" onClose={onClose}>
      <div className="search-panel">
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setActive(Math.max(0, Math.min(selected + (event.key === "ArrowDown" ? 1 : -1), hits.length - 1)));
            }
            if (event.key === "Enter" && hits[selected]) {
              event.preventDefault();
              go(hits[selected].href);
            }
          }}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          placeholder="Search news, patches, roadmap…"
          aria-label="Search"
          aria-controls="smart-search-results"
          aria-activedescendant={hits[selected] ? `search-result-${selected}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <button className="search-close" type="button" onClick={onClose} aria-label="Close search">
          ×
        </button>
        <div className="search-results-head" aria-live="polite">
          <div>
            <span className="eyebrow">Search results</span>
            <strong>{q.trim() ? `Results for “${q.trim()}”` : "Popular right now"}</strong>
          </div>
          <span>{hits.length} shown</span>
        </div>
        <ul id="smart-search-results" className="search-results" role="listbox" aria-label="Search results">
          {hits.map((hit, i) => (
            <li key={`${hit.href}-${hit.title}`} role="presentation">
              <button
                id={`search-result-${i}`}
                type="button"
                role="option"
                aria-selected={i === selected}
                tabIndex={-1}
                className={i === selected ? "on" : ""}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(hit.href)}
              >
                <span className="search-result-copy">
                  <span className="kind">{hit.kicker}</span>
                  <strong>{hit.title}</strong>
                  <span>{hit.blurb || "Open this result"}</span>
                </span>
                <span className="search-result-arrow" aria-hidden>↗</span>
              </button>
            </li>
          ))}
        </ul>
        {hits.length === 0 ? <p className="empty-note" role="status">No results. Try a patch version, ship name, or another keyword.</p> : null}
        <p className="search-hint">Typo tolerant · ↑↓ to move · Enter to open</p>
      </div>
    </Modal>
  );
}

export function SearchControl() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const target = event.target;
      const editing = target instanceof HTMLElement && (target.isContentEditable || Boolean(target.closest("input, textarea, select")));
      const slash = event.key === "/" && !editing && !event.metaKey && !event.ctrlKey && !event.altKey;
      if (!shortcut && !slash) return;
      if (!open && document.querySelector("dialog[open]")) return;
      event.preventDefault();
      setOpen((value) => shortcut ? !value : true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <>
      <button
        id="search-launch"
        type="button"
        className="icon-btn search-launch"
        onClick={() => setOpen(true)}
        aria-label="Search"
        title="Search (press / or Ctrl+K)"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>Search</span>
      </button>
      {open ? <SearchDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}
