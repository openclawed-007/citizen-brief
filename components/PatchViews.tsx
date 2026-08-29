"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { PatchArticle } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/format";
import { useFeed } from "./FeedProvider";

export function PatchList() {
  const { feed } = useFeed();

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Live channel</p>
          <h1>Patch notes</h1>
          <p className="lede">
            Every published live build, newest first. Open a version for the full notes
            and the roadmap cards that shipped with it.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell list">
          {feed.patches.map((p) => (
            <Link key={p.code} href={`/patches/${p.version}`} className="row">
              <span className="ver">
                {p.isLive ? <span className="live-flag">LIVE</span> : null} {p.version}
              </span>
              <span className="name">{p.title}</span>
              <span className="meta">{p.releasedAt ? relativeTime(p.releasedAt) : ""}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function PatchArticleView({ article }: { article: PatchArticle }) {
  const { html, toc } = useMemo(() => {
    let i = 0;
    const toc: { id: string; title: string }[] = [];
    const html = article.html.replace(/<h2>([\s\S]*?)<\/h2>/gi, (_m, inner) => {
      const id = `sec-${i}`;
      const title = String(inner).replace(/<[^>]+>/g, "").trim();
      toc.push({ id, title });
      i += 1;
      return `<h2 id="${id}">${inner}</h2>`;
    });
    return { html, toc };
  }, [article.html]);

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">{article.isLive ? "Current live patch" : "Archive"}</p>
          <h1>{article.title}</h1>
          <div className="meta-row">
            <span>{article.build || article.version}</span>
            {article.publishDate ? (
              <span>{article.publishDate}</span>
            ) : article.releasedAt ? (
              <span>{formatDate(article.releasedAt)}</span>
            ) : null}
          </div>
          {article.summary ? <p className="lede">{article.summary}</p> : null}
          <div className="actions">
            {article.rsiUrl ? (
              <a className="btn primary" href={article.rsiUrl} target="_blank" rel="noreferrer">
                Official RSI notes
              </a>
            ) : null}
            <a className="btn" href={article.wikiUrl} target="_blank" rel="noreferrer">
              Wiki source
            </a>
            <Link className="btn" href="/patches">
              All patches
            </Link>
          </div>
        </div>
      </section>

      {article.cards.length > 0 ? (
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">Shipped</p>
                <h2>In this release</h2>
              </div>
            </div>
            {article.cards.map((card, i) => (
              <div key={card.id} className="cat-row" style={{ cursor: "default" }}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span className="name">{card.name}</span>
                <span className="meta">{card.category}</span>
                <span className="status">{card.status}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="article" style={{ paddingTop: 24 }}>
        {toc.length > 1 ? (
          <nav className="toc" aria-label="On this page">
            <strong>On this page</strong>
            {toc.map((t) => (
              <a key={t.id} href={`#${t.id}`}>
                {t.title}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
        <div className="actions" style={{ marginTop: 28 }}>
          {article.prev ? (
            <Link className="btn" href={`/patches/${article.prev.replace(/^Star Citizen Alpha\s+/i, "")}`}>
              ← {article.prev}
            </Link>
          ) : null}
          {article.next ? (
            <Link className="btn" href={`/patches/${article.next.replace(/^Star Citizen Alpha\s+/i, "")}`}>
              {article.next} →
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
