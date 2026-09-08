"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NewsArticle, NewsKind } from "@/lib/types";
import { formatDate, formatDateTime, kindLabel } from "@/lib/format";
import { useFeed } from "./FeedProvider";
import { MediaImage } from "./MediaImage";
import { NewsLead } from "./NewsLead";

const FILTERS: { id: "all" | NewsKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "patch", label: "Patches" },
  { id: "roadmap", label: "Roadmap" },
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "Monthly" },
  { id: "chairman", label: "Chairman" },
  { id: "ship", label: "Ships" },
];

export function NewsList() {
  const { feed, newsHref } = useFeed();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return feed.news.filter((n) => {
      if (filter !== "all" && n.kind !== filter) return false;
      if (query && !`${n.title} ${n.excerpt}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [feed.news, filter, q]);
  const lead = items[0];

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Official feed · Automatically updated</p>
          <h1>Latest news</h1>
          <p className="lede">
            Patches, development reports, events, and announcements from RSI, in one place.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="filters">
            <input
              className="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search news"
              aria-label="Search transmissions"
            />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={filter === f.id ? "chip on" : "chip"}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="results-count" role="status">{items.length} {items.length === 1 ? "story" : "stories"} shown</p>
          {lead ? (
            <NewsLead item={lead} href={newsHref(lead)} priority />
          ) : (
            <p className="empty-note" role="status">No matching stories. <button className="link-btn" type="button" onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</button></p>
          )}
          {items.length > 1 ? <div className="index">
            {items.slice(1).map((item) => (
              <Link key={item.id} href={newsHref(item)}>
                <time>{item.publishedAt ? formatDate(item.publishedAt) : ""}</time>
                <span className="kind">{kindLabel(item.kind)}</span>
                <span className="name">{item.title}</span>
              </Link>
            ))}
          </div> : null}
        </div>
      </section>
    </main>
  );
}

export function NewsArticleView({ article }: { article: NewsArticle }) {
  const cover = article.images.find((image) => image.url === article.image) || article.images[0];
  const gallery = article.images.filter((image) => image.url !== cover?.url).slice(0, 6);

  return (
    <main id="content" className="article">
      <Link className="back-link" href="/news">← All news</Link>
      <p className="eyebrow">{kindLabel(article.kind)}</p>
      <h1>{article.title}</h1>
      <div className="meta-row">
        {article.publishedAt ? <span>{formatDateTime(article.publishedAt)}</span> : null}
        <span>{article.channel}</span>
        {article.series && article.series !== "None" ? <span>{article.series}</span> : null}
      </div>
      {cover ? <MediaImage className="cover" src={cover.url} alt={cover.alt} priority /> : null}
      <div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} />
      {gallery.length > 0 ? (
        <details className="article-gallery">
          <summary>More images ({gallery.length})</summary>
          <p className="empty-note">Select an image to open it full size.</p>
          <div className="gallery">
            {gallery.map((image, index) => (
              <a key={image.url} href={image.url} target="_blank" rel="noreferrer" aria-label={`Open image ${index + 1} full size (new tab)`}>
                <MediaImage src={image.url} alt={image.alt} />
              </a>
            ))}
          </div>
        </details>
      ) : null}
      <div className="actions actions-spaced">
        <a className="btn primary" href={article.url} target="_blank" rel="noreferrer">
          Read on RSI
        </a>
        <Link className="btn" href="/news">
          All transmissions
        </Link>
      </div>
    </main>
  );
}
