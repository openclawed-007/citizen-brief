"use client";

import Link from "next/link";
import { formatDate, formatMoney, formatNumber, kindLabel, relativeTime, statusLabel, statusTone } from "@/lib/format";
import { useFeed } from "./FeedProvider";
import { RoadmapColumn } from "./RoadmapBoard";

export function HomeView() {
  const { feed } = useFeed();
  const { live, status, stats, news, roadmap } = feed;
  const features = (roadmap.current?.cards || []).slice(0, 6);
  const nextRel = roadmap.upcoming[0];

  return (
    <main id="content">
      <section className="hero">
        <div className="shell hero-grid">
          <div>
            <div className="kicker">Live environment</div>
            <h1>Alpha {live.version}</h1>
            <p className="codename">{live.title}</p>
            <p className="lede">{live.summary}</p>
            <div className="meta-row">
              <span>{live.build || "Build pending"}</span>
              {live.releasedAt ? <span>Published {formatDate(live.releasedAt)}</span> : null}
              <span>Channel {live.channel.toUpperCase()}</span>
            </div>
            <div className="actions">
              <Link className="btn primary" href={`/patches/${live.version}`}>
                Read patch notes
              </Link>
              {live.rsiPatchUrl ? (
                <a className="btn ghost" href={live.rsiPatchUrl} target="_blank" rel="noreferrer">
                  Official RSI
                </a>
              ) : (
                <Link className="btn ghost" href="/roadmap">
                  View roadmap
                </Link>
              )}
            </div>
          </div>
          <div className="hero-panel">
            {live.image ? (
              <img src={live.image} alt={live.title} />
            ) : (
              <div style={{ minHeight: 340, background: "linear-gradient(135deg,#1a2433,#0c1018)" }} />
            )}
            <div className="hero-caption">Artwork from the official public roadmap · RSI</div>
          </div>
        </div>
      </section>

      <div className="shell strip">
        <div className="stat">
          <span>Universe</span>
          <b className={`tone-${statusTone(status.summary)}`}>{statusLabel(status.summary)}</b>
        </div>
        <div className="stat">
          <span>Citizens</span>
          <b>{formatNumber(stats.citizens)}</b>
        </div>
        <div className="stat">
          <span>Funding</span>
          <b>{formatMoney(stats.fundsUsd)}</b>
        </div>
        <div className="stat">
          <span>Next on the board</span>
          <b>{nextRel ? `Alpha ${nextRel.name}` : "—"}</b>
        </div>
      </div>

      {status.systems.length > 0 ? (
        <div className="shell" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: -28, marginBottom: 36 }}>
          {status.systems.map((s) => (
            <span key={s.name} className="tag" style={{ color: "inherit" }}>
              <span className={`tone-${statusTone(s.status)}`}>●</span>&nbsp;{s.name}
            </span>
          ))}
        </div>
      ) : null}

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="kicker">In this release</div>
              <h2>What landed in {live.version}</h2>
            </div>
            <Link href="/roadmap" className="btn ghost">
              Full roadmap
            </Link>
          </div>
          <div className="cards">
            {features.map((card) => (
              <article key={card.id} className="feature">
                <div className="feature-media">
                  {card.image ? <img src={card.image} alt={card.name} /> : <div className="ph" />}
                </div>
                <div className="feature-body">
                  <span className={`tag ${card.status === "Released" ? "ok" : "warn"}`}>
                    {card.category} · {card.status}
                  </span>
                  <h3>{card.name}</h3>
                  <p>{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {nextRel ? (
        <section className="section">
          <div className="shell">
            <div className="section-head">
              <div>
                <div className="kicker">On the horizon</div>
                <h2>Alpha {nextRel.name}</h2>
                <p>{nextRel.cards.length} deliverables currently scheduled · {nextRel.status}</p>
              </div>
            </div>
            <RoadmapColumn release={nextRel} limit={8} />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="kicker">Transmissions</div>
              <h2>Latest official posts</h2>
            </div>
            <Link href="/news" className="btn ghost">
              All comm-links
            </Link>
          </div>
          <div className="cards">
            {news.slice(0, 6).map((item) => (
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
