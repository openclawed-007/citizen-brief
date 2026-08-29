"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NewsArticle, NewsKind } from "@/lib/types";
import { formatDateTime, kindLabel, relativeTime } from "@/lib/format";
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
  const { feed } = useFeed();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const items = useMemo(
    () => feed.news.filter((n) => filter === "all" || n.kind === filter),
    [feed.news, filter],
  );

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <div className="kicker">Comm-links</div>
          <h1>Official information</h1>
          <p className="lede">
            Transmissions, patch announcements, roadmap roundups, and letters from the
            chairman — ingested as RSI publishes them.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell">
          <div className="filters">
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
          <div className="cards">
            {items.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className="card">
                <div className="card-media">
                  {item.image ? <img src={item.image} alt="" /> : <div className="ph" style={{ width: "100%", height: "100%" }} />}
                </div>
                <div className="card-body">
                  <span className="tag">{kindLabel(item.kind)}</span>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                  <div className="card-foot">{item.publishedAt ? relativeTime(item.publishedAt) : ""}</div>
                </div>
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
      <div className="kicker">{kindLabel(article.kind)}</div>
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
          style={{ width: "100%", borderRadius: 18, margin: "8px 0 24px", border: "1px solid var(--line)" }}
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
        <Link className="btn ghost" href="/news">
          All transmissions
        </Link>
      </div>
    </main>
  );
}
