"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFeed } from "./FeedProvider";
import { kindLabel } from "@/lib/format";

type Hit = { href: string; kicker: string; title: string; blurb: string };

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { feed } = useFeed();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const hits = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out: Hit[] = [];
    for (const p of feed.patches) {
      const hay = `${p.version} ${p.title} ${p.build}`.toLowerCase();
      if (hay.includes(query)) {
        out.push({
          href: `/patches/${p.version}`,
          kicker: p.isLive ? "Live patch" : "Patch",
          title: p.title,
          blurb: p.build,
        });
      }
    }
    for (const rel of feed.roadmap.releases) {
      for (const card of rel.cards) {
        const hay = `${card.name} ${card.category} ${card.description} ${rel.name}`.toLowerCase();
        if (hay.includes(query)) {
          out.push({
            href: `/roadmap`,
            kicker: `Roadmap · Alpha ${rel.name}`,
            title: card.name,
            blurb: card.description.slice(0, 140),
          });
        }
      }
    }
    for (const n of feed.news) {
      const hay = `${n.title} ${n.excerpt} ${n.kind}`.toLowerCase();
      if (hay.includes(query)) {
        out.push({
          href: `/news/${n.id}`,
          kicker: kindLabel(n.kind),
          title: n.title,
          blurb: n.excerpt.slice(0, 140),
        });
      }
    }
    return out.slice(0, 12);
  }, [feed, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
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
    router.push(href);
  };

  return (
    <div className="search-back" onClick={onClose} role="presentation">
      <div
        className="search-panel"
        role="dialog"
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
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          placeholder="Search patches, roadmap, transmissions"
          aria-label="Search"
        />
        <p className="search-hint">Type at least two letters. Enter to open.</p>
        <ul>
          {hits.map((hit, i) => (
            <li key={`${hit.href}-${hit.title}`}>
              <button
                type="button"
                className={i === active ? "on" : ""}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(hit.href)}
              >
                <span className="kind">{hit.kicker}</span>
                <strong>{hit.title}</strong>
                <span>{hit.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
        {q.trim().length >= 2 && hits.length === 0 ? <p className="search-hint">No matches in this issue.</p> : null}
      </div>
    </div>
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
