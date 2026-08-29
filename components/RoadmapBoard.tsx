"use client";

import { useMemo, useState } from "react";
import type { RoadmapCard, RoadmapRelease } from "@/lib/types";
import { useFeed } from "./FeedProvider";
import { FeatureEntry } from "./FeatureEntry";
import { formatDateTime } from "@/lib/format";

export function CardDrawer({
  card,
  onClose,
}: {
  card: RoadmapCard | null;
  onClose: () => void;
}) {
  if (!card) return null;
  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <div className="modal" role="dialog" aria-labelledby="card-title" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">
          {card.release} · {card.category}
        </p>
        <h3 id="card-title">{card.name}</h3>
        <p className="status" style={{ textAlign: "left" }}>
          {card.status}
        </p>
        {card.image ? <img src={card.image} alt="" /> : null}
        <p style={{ color: "var(--ink-soft)", lineHeight: 1.65 }}>{card.description}</p>
        <div className="actions">
          <a className="btn" href={card.url} target="_blank" rel="noreferrer">
            View on RSI
          </a>
          <button className="btn primary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Chapter({
  release,
  category,
  onOpen,
}: {
  release: RoadmapRelease;
  category: string;
  onOpen: (card: RoadmapCard) => void;
}) {
  const cards = release.cards.filter((c) => category === "All" || c.category === category);
  const label = release.name === "Star Citizen 1.0" ? "Star Citizen 1.0" : `Alpha ${release.name}`;
  return (
    <section className="chapter">
      <p className="chapter-kicker">
        {release.name === "Star Citizen 1.0" ? "Horizon" : "Release"} · {release.status}
      </p>
      <h3>{label}</h3>
      <p style={{ color: "var(--mute)", margin: "0 0 12px", fontSize: 14 }}>
        {cards.length} {cards.length === 1 ? "item" : "items"}
      </p>
      {cards.map((card, i) => (
        <FeatureEntry key={card.id} card={card} index={i} compact onOpen={onOpen} />
      ))}
      {cards.length === 0 ? <p style={{ color: "var(--faint)" }}>Nothing in this category.</p> : null}
    </section>
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
          <p className="eyebrow">Public board</p>
          <h1>Roadmap</h1>
          <p className="lede">
            Current live column, the next patch, and Star Citizen 1.0 — copied from RSI Release
            View whenever Cloud Imperium publishes a roundup.
          </p>
          <div className="meta-row">
            {roadmap.lastUpdatedIso ? <span>Board updated {formatDateTime(roadmap.lastUpdatedIso)}</span> : null}
            {roadmap.notificationTitle ? <span>{roadmap.notificationTitle}</span> : null}
          </div>
          <div className="actions">
            <a className="btn primary" href={roadmap.officialUrl} target="_blank" rel="noreferrer">
              Open RSI roadmap
            </a>
            {roadmap.notificationUrl ? (
              <a className="btn" href={roadmap.notificationUrl} target="_blank" rel="noreferrer">
                Latest roundup
              </a>
            ) : null}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="filters" aria-label="Filter by category">
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
              <Chapter key={rel.id} release={rel} category={category} onOpen={setOpen} />
            ))}
          </div>
        </div>
      </section>
      <CardDrawer card={open} onClose={() => setOpen(null)} />
    </main>
  );
}
