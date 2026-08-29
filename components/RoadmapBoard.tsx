"use client";

import { useMemo, useState } from "react";
import type { RoadmapCard, RoadmapRelease } from "@/lib/types";
import { useFeed } from "./FeedProvider";
import { formatDateTime, statusTone } from "@/lib/format";

export function RoadmapColumn({
  release,
  limit,
  category,
  onOpen,
}: {
  release: RoadmapRelease;
  limit?: number;
  category?: string;
  onOpen?: (card: RoadmapCard) => void;
}) {
  const cards = release.cards.filter((c) => !category || category === "All" || c.category === category);
  const shown = typeof limit === "number" ? cards.slice(0, limit) : cards;

  return (
    <div className="column">
      <div className="column-head">
        <div>
          <div className="kicker" style={{ letterSpacing: "0.18em" }}>
            {release.name === "Star Citizen 1.0" ? "Horizon" : "Release"}
          </div>
          <h3>{release.name === "Star Citizen 1.0" ? "Star Citizen 1.0" : `Alpha ${release.name}`}</h3>
        </div>
        <span className={`tag ${statusTone(release.status) === "ok" ? "ok" : "warn"}`}>
          {release.status}
        </span>
      </div>
      <div className="column-stack">
        {shown.map((card) => (
          <button key={card.id} className="mini" type="button" onClick={() => onOpen?.(card)}>
            {card.image ? <img src={card.image} alt="" /> : <div className="ph" />}
            <span>
              <strong>{card.name}</strong>
              <small>
                {card.category} · {card.status}
              </small>
            </span>
          </button>
        ))}
        {shown.length === 0 ? <p style={{ color: "var(--faint)" }}>No cards in this filter.</p> : null}
      </div>
    </div>
  );
}

export function RoadmapView() {
  const { feed } = useFeed();
  const { roadmap } = feed;
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState<RoadmapCard | null>(null);

  const columns = useMemo(() => {
    const list: RoadmapRelease[] = [];
    if (roadmap.current) list.push(roadmap.current);
    roadmap.upcoming.slice(0, 1).forEach((r) => list.push(r));
    if (roadmap.horizon) list.push(roadmap.horizon);
    return list;
  }, [roadmap]);

  const cats = ["All", ...roadmap.categories];

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <div className="kicker">Public roadmap</div>
          <h1>Release view</h1>
          <p className="lede" style={{ maxWidth: 640 }}>
            Direct from the official RSI Release View. Cards move when Cloud Imperium publishes a
            roadmap roundup — this board refreshes itself.
          </p>
          <div className="meta-row">
            <span>{roadmap.liveVersionLabel.replace(/\[.*?\]\(.*?\)/g, "").slice(0, 80)}</span>
            {roadmap.lastUpdatedIso ? <span>Updated {formatDateTime(roadmap.lastUpdatedIso)}</span> : null}
            {roadmap.notificationTitle ? <span>{roadmap.notificationTitle}</span> : null}
          </div>
          <div className="actions">
            <a className="btn primary" href={roadmap.officialUrl} target="_blank" rel="noreferrer">
              Open RSI roadmap
            </a>
            {roadmap.notificationUrl ? (
              <a className="btn ghost" href={roadmap.notificationUrl} target="_blank" rel="noreferrer">
                Latest roundup
              </a>
            ) : null}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="filters">
            {cats.map((c) => (
              <button
                key={c}
                className={category === c ? "chip on" : "chip"}
                onClick={() => setCategory(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
          <div className="board">
            {columns.map((rel) => (
              <RoadmapColumn
                key={rel.id}
                release={rel}
                category={category}
                onOpen={setOpen}
              />
            ))}
          </div>
        </div>
      </section>
      {open ? (
        <div className="modal-back" onClick={() => setOpen(null)} role="presentation">
          <div className="modal" role="dialog" onClick={(e) => e.stopPropagation()}>
            <span className="tag">{open.category} · {open.status}</span>
            <h3>{open.name}</h3>
            {open.image ? <img src={open.image} alt="" /> : null}
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>{open.description}</p>
            <div className="actions" style={{ marginTop: 16 }}>
              <a className="btn ghost" href={open.url} target="_blank" rel="noreferrer">
                View on RSI
              </a>
              <button className="btn primary" type="button" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
