"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useFeed } from "./FeedProvider";
import { kindLabel } from "@/lib/format";
import { rankSearch, type SearchCandidate } from "@/lib/search";

type Hit = SearchCandidate & {
  href: string;
  kicker: string;
  blurb: string;
};

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { feed, newsHref, patchHref } = useFeed();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

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
    ...(feed.roadmap.current ? [feed.roadmap.current] : []),
    ...feed.roadmap.upcoming,
    ...(feed.roadmap.horizon ? [feed.roadmap.horizon] : []),
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

  const hits = rankSearch(candidates, q);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => input.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.getElementById("search-launch")?.focus();
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onClose();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else document.getElementById("search-launch")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.getElementById("search-launch")?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    if (/^https?:\/\//.test(href)) window.location.assign(href);
    else router.push(href);
  };

  return createPortal(
    <div
      className="search-back"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Search the briefing"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          }
          if (e.key === "Enter" && hits[active]) go(hits[active].href);
        }}
      >
        <button className="search-close" type="button" onClick={onClose} aria-label="Close search">
          ×
        </button>
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          placeholder="Search news, patches, roadmap…"
          aria-label="Search"
          aria-controls="smart-search-results"
          aria-activedescendant={hits[active] ? `search-result-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="search-results-head" aria-live="polite">
          <div>
            <span className="eyebrow">Smart suggestions</span>
            <strong>{q.trim() ? `Related to “${q.trim()}”` : "Popular right now"}</strong>
          </div>
          <span>{hits.length} shown</span>
        </div>
        <ul id="smart-search-results" className="search-results" role="listbox">
          {hits.map((hit, i) => (
            <li key={`${hit.href}-${hit.title}`} role="presentation">
              <button
                id={`search-result-${i}`}
                type="button"
                role="option"
                aria-selected={i === active}
                className={i === active ? "on" : ""}
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
        <p className="search-hint">Typo tolerant · ↑↓ to move · Enter to open</p>
      </div>
    </div>,
    document.body,
  );
}

export function SearchControl() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        id="search-launch"
        type="button"
        className="icon-btn search-launch"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        Search
      </button>
      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
