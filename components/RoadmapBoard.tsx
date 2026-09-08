"use client";

import { useState } from "react";
import type { RoadmapCard, RoadmapRelease } from "@/lib/types";
import { useFeed } from "./FeedProvider";
import { Modal } from "./Modal";
import { MediaImage } from "./MediaImage";
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
    <Modal className="modal-back" labelledBy="card-title" onClose={onClose}>
      <div className="modal">
        <button autoFocus className="icon-btn modal-close" type="button" onClick={onClose} aria-label="Close details">×</button>
        <p className="eyebrow">
          {card.release} · {card.category}
        </p>
        <h3 id="card-title">{card.name}</h3>
        <p className="status">{card.status}</p>
        {card.image ? <MediaImage src={card.image} /> : null}
        <p>{card.description}</p>
        <div className="actions">
          <a className="btn" href={card.url} target="_blank" rel="noreferrer">
            View on RSI
          </a>
          <button className="btn primary" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
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
      <p className="chapter-count">
        {cards.length} {cards.length === 1 ? "item" : "items"}
      </p>
      {cards.map((card, i) => (
        <FeatureEntry key={card.id} card={card} index={i} compact onOpen={onOpen} />
      ))}
      {cards.length === 0 ? <p className="chapter-empty">Nothing in this category.</p> : null}
    </section>
  );
}

export function RoadmapView() {
  const { feed } = useFeed();
  const { roadmap } = feed;
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState<RoadmapCard | null>(null);

  const columns: RoadmapRelease[] = [
    ...(roadmap.current ? [roadmap.current] : []),
    ...roadmap.upcoming.slice(0, 1),
    ...(roadmap.horizon ? [roadmap.horizon] : []),
  ];

  const cats = ["All", ...roadmap.categories];

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Release view · Synced from RSI</p>
          <h1>What’s next</h1>
          <p className="lede">
            See what is live, what is scheduled for the next release, and the path toward
            Star Citizen 1.0 without digging through the full public board.
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
                aria-pressed={category === c}
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
