"use client";

import Link from "next/link";
import type { PatchArticle } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/format";
import { useFeed } from "./FeedProvider";

export function PatchList() {
  const { feed } = useFeed();

  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <div className="kicker">Live channel</div>
          <h1>Patch notes</h1>
          <p className="lede">
            Every published live build, starting with the current environment. Notes are
            pulled from the Star Citizen Wiki transcription of official RSI patch notes
            and refresh when a new build ships.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell list">
          {feed.patches.map((p) => (
            <Link key={p.code} href={`/patches/${p.version}`} className="row">
              <span className="ver">
                {p.isLive ? "LIVE · " : ""}
                {p.version}
              </span>
              <span>
                <strong style={{ display: "block" }}>{p.title}</strong>
                <small style={{ color: "var(--faint)", fontFamily: "var(--font-mono)" }}>
                  {p.build}
                </small>
              </span>
              <span className="card-foot">{p.releasedAt ? relativeTime(p.releasedAt) : ""}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function PatchArticleView({ article }: { article: PatchArticle }) {
  return (
    <main id="content">
      <section className="page-hero">
        <div className="shell">
          <div className="kicker">{article.isLive ? "Current live patch" : "Archive"}</div>
          <h1>{article.title}</h1>
          <div className="meta-row">
            <span>{article.build || article.version}</span>
            {article.publishDate ? <span>{article.publishDate}</span> : article.releasedAt ? <span>{formatDate(article.releasedAt)}</span> : null}
            <span>Source: {article.source === "wiki" ? "Star Citizen Wiki" : article.source === "comm-link" ? "RSI comm-link" : "Roadmap"}</span>
          </div>
          {article.summary ? <p className="lede">{article.summary}</p> : null}
          <div className="actions">
            {article.rsiUrl ? (
              <a className="btn primary" href={article.rsiUrl} target="_blank" rel="noreferrer">
                Official RSI notes
              </a>
            ) : null}
            <a className="btn ghost" href={article.wikiUrl} target="_blank" rel="noreferrer">
              Wiki source
            </a>
          </div>
        </div>
      </section>

      {article.cards.length > 0 ? (
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <div className="kicker">Roadmap cards</div>
                <h2>Shipped with this release</h2>
              </div>
            </div>
            <div className="cards">
              {article.cards.map((card) => (
                <article key={card.id} className="feature">
                  <div className="feature-media">
                    {card.image ? <img src={card.image} alt="" /> : <div className="ph" />}
                  </div>
                  <div className="feature-body">
                    <span className={`tag ${card.status === "Released" ? "ok" : "warn"}`}>
                      {card.category}
                    </span>
                    <h3>{card.name}</h3>
                    <p>{card.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="article" style={{ paddingTop: 0 }}>
        <div className="prose" dangerouslySetInnerHTML={{ __html: article.html }} />
        <div className="actions" style={{ marginTop: 28 }}>
          {article.prev ? (
            <Link className="btn ghost" href={`/patches/${article.prev.replace(/^Star Citizen Alpha\s+/i, "")}`}>
              ← {article.prev}
            </Link>
          ) : null}
          {article.next ? (
            <Link className="btn ghost" href={`/patches/${article.next.replace(/^Star Citizen Alpha\s+/i, "")}`}>
              {article.next} →
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
