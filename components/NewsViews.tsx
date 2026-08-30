"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NewsArticle, NewsKind } from "@/lib/types";
import { formatDate, formatDateTime, kindLabel } from "@/lib/format";
import { useFeed } from "./FeedProvider";

const FILTERS: { id: "all" | NewsKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "patch", label: "Patches" },
  { id: "roadmap", label: "Roadmap" },
  { id: "weekly", label: "This Week" },
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
            Patches, development reports, events, and announcements from RSI — organized
            the moment they are published.
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
              placeholder="Search titles"
              aria-label="Search transmissions"
            />
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={filter === f.id ? "chip on" : "chip"}
                type="button"
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          {lead ? (
            <Link href={newsHref(lead)} className="lead-story">
              {lead.image ? <img src={lead.image} alt="" /> : <div className="ph" />}
              <div>
                <span className="kind">{kindLabel(lead.kind)}</span>
                <h3>{lead.title}</h3>
                <p>{lead.excerpt}</p>
              </div>
            </Link>
          ) : (
            <p style={{ color: "var(--mute)" }}>No matching transmissions.</p>
          )}
          <div className="index">
            {items.slice(1).map((item) => (
              <Link key={item.id} href={newsHref(item)}>
                <time>{item.publishedAt ? formatDate(item.publishedAt) : ""}</time>
                <span className="kind">{kindLabel(item.kind)}</span>
                <span className="name">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function NewsArticleView({ article }: { article: NewsArticle }) {
  const cover =
    article.images.find((img) => !/divid|line|icon/i.test(img.name) && img.url) ||
    article.images[0];

  return (
    <main id="content" className="article">
      <p className="eyebrow">{kindLabel(article.kind)}</p>
      <h1>{article.title}</h1>
      <div className="meta-row">
        {article.publishedAt ? <span>{formatDateTime(article.publishedAt)}</span> : null}
        <span>{article.channel}</span>
        {article.series && article.series !== "None" ? <span>{article.series}</span> : null}
      </div>
      {cover ? (
        <img
          src={cover.url}
          alt={cover.alt}
          style={{ width: "100%", margin: "8px 0 24px", border: "1px solid var(--ink)" }}
        />
      ) : null}
      <div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} />
      {article.images.length > 1 ? (
        <div className="gallery">
          {article.images.slice(0, 6).map((img) => (
            <img key={img.url} src={img.url} alt={img.alt} />
          ))}
        </div>
      ) : null}
      <div className="actions" style={{ marginTop: 28 }}>
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
