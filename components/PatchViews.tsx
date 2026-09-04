"use client";

import Link from "next/link";
import type { PatchArticle } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/format";
import { FeatureEntry } from "./FeatureEntry";
import { useFeed } from "./FeedProvider";
import { PatchBriefing } from "./PatchBriefing";

export function PatchList() {
  const { feed, patchHref } = useFeed();

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">Build archive · Newest first</p>
          <h1>Patch notes</h1>
          <p className="lede">
            The current live build and every recent release in one place, with official
            notes and shipped roadmap items.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell list">
          {feed.patches.map((p) => (
            <Link key={p.code} href={patchHref(p)} className="row">
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

function prepareArticle(source: string) {
  const headings = [...source.matchAll(/<h2>([\s\S]*?)<\/h2>/gi)];
  const toc = headings.map((match, index) => ({
    id: `sec-${index}`,
    title: String(match[1]).replace(/<[^>]+>/g, "").trim(),
  }));
  const html = headings.reduce(
    (result, match, index) => result.replace(match[0], `<h2 id="sec-${index}">${match[1]}</h2>`),
    source,
  );
  return { html, toc };
}

export function PatchArticleView({ article }: { article: PatchArticle }) {
  const { html, toc } = prepareArticle(article.html);

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

      {article.wantsBrief ? <PatchBriefing brief={article.brief} /> : null}

      {article.cards.length > 0 ? (
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">Shipped</p>
                <h2>In this release</h2>
              </div>
            </div>
            <div className="feature-stack">
              {article.cards.map((card, i) => (
                <FeatureEntry key={card.id} card={card} index={i} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="article article-body">
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
        <div className="actions actions-spaced">
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
