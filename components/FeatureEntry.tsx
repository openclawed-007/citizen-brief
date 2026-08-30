"use client";

import type { RoadmapCard } from "@/lib/types";

function Copy({ card, index }: { card: RoadmapCard; index: number }) {
  return (
    <span className="feature-copy">
      <span className="feature-meta">
        <span className="num">{String(index + 1).padStart(2, "0")}</span>
        <span className="kind">
          {card.category} · {card.status}
        </span>
      </span>
      <strong className="name">{card.name}</strong>
      {card.description ? <span className="desc">{card.description}</span> : null}
    </span>
  );
}

function Still({ card }: { card: RoadmapCard }) {
  return card.image ? <img src={card.image} alt="" /> : <div className="ph" aria-hidden />;
}

export function FeatureEntry({
  card,
  index,
  featured = false,
  compact = false,
  onOpen,
}: {
  card: RoadmapCard;
  index: number;
  featured?: boolean;
  compact?: boolean;
  onOpen?: (card: RoadmapCard) => void;
}) {
  const className = featured ? "feature-hero" : compact ? "feature-entry compact" : "feature-entry";
  if (onOpen) {
    return (
      <button type="button" className={className} onClick={() => onOpen(card)}>
        <Still card={card} />
        <Copy card={card} index={index} />
      </button>
    );
  }
  return (
    <article className={className}>
      <Still card={card} />
      <Copy card={card} index={index} />
    </article>
  );
}
