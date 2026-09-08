"use client";

import Link from "next/link";
import { useState } from "react";
import type { RoadmapCard } from "@/lib/types";
import {
  formatDate,
  formatMoney,
  formatNumber,
  kindLabel,
  statusLabel,
  statusTone,
} from "@/lib/format";
import { useFeed } from "./FeedProvider";
import { CardDrawer } from "./RoadmapBoard";
import { FeatureEntry } from "./FeatureEntry";
import { MediaImage } from "./MediaImage";
import { NewsLead } from "./NewsLead";

export function HomeView() {
  const { feed, newsHref, patchHref } = useFeed();
  const { live, status, stats, news, roadmap } = feed;
  const features = roadmap.current?.cards || [];
  const nextRel = roadmap.upcoming[0];
  const lead = news[0];
  const [open, setOpen] = useState<RoadmapCard | null>(null);

  return (
    <main id="content">
      <section className="home-top" id="patch">
        <div className="shell">
          <nav className="jump" aria-label="On this page">
            <span>Jump to</span>
            <a href="#in-patch">Release highlights</a>
            {nextRel ? <a href="#next">Coming next</a> : null}
            <a href="#posts">Latest news</a>
          </nav>

          <div className="hero">
            <div className="hero-grid">
              <div className="hero-copy">
                <p className="eyebrow">
                  <span className={`dot ${statusTone(status.summary)}`} aria-hidden /> Current
                  live build
                </p>
                <h1>Alpha {live.version}</h1>
                <p className="title">{live.title}</p>
                <p className="lede">{live.summary}</p>
                <div className="actions">
                  <Link
                    className="btn primary"
                    href={patchHref({ version: live.version, wikiUrl: live.wikiUrl || "/patches" })}
                  >
                    Read the patch notes
                  </Link>
                  <Link className="btn" href="/roadmap">
                    Open the roadmap
                  </Link>
                  {live.rsiPatchUrl ? (
                    <a className="btn" href={live.rsiPatchUrl} target="_blank" rel="noreferrer">
                      RSI original
                    </a>
                  ) : null}
                </div>
              </div>
              <figure className="hero-media">
                <MediaImage src={live.image} alt={live.title} priority />
              </figure>
            </div>
            <dl className="facts">
              <div>
                <dt>Build</dt>
                <dd>{live.build || "Pending"}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{live.releasedAt ? formatDate(live.releasedAt) : "—"}</dd>
              </div>
              <div>
                <dt>Universe</dt>
                <dd className={`tone-${statusTone(status.summary)}`}>
                  {statusLabel(status.summary)}
                </dd>
              </div>
              <div>
                <dt>Next release</dt>
                <dd>{nextRel ? `Alpha ${nextRel.name}` : "—"}</dd>
              </div>
              <div>
                <dt>Citizens</dt>
                <dd>{formatNumber(stats.citizens)}</dd>
              </div>
              <div>
                <dt>Funding</dt>
                <dd>{formatMoney(stats.fundsUsd)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section" id="in-patch">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Inside the update</p>
              <h2>What changed in {live.version}</h2>
              <p>From the current release board. Select an item for details.</p>
            </div>
            <Link className="more" href="/roadmap">
              All release details →
            </Link>
          </div>
          <div className="feature-stack">
            {features.slice(0, 4).map((card, i) => (
              <FeatureEntry key={card.id} card={card} index={i} onOpen={setOpen} />
            ))}
          </div>
          {!features.length ? <p className="empty-note">Release details are temporarily unavailable. You can still read the official patch notes above.</p> : null}
        </div>
      </section>

      {nextRel ? (
        <section className="section" id="next">
          <div className="shell">
            <div className="section-head">
              <div>
                <p className="eyebrow">Scheduled</p>
                <h2>Coming in Alpha {nextRel.name}</h2>
                <p>
                  {nextRel.cards.length} items on the public board · {nextRel.status}
                </p>
              </div>
              <Link className="more" href="/roadmap">
                See all columns
              </Link>
            </div>
            <div className="feature-stack">
              {nextRel.cards.slice(0, 4).map((card, i) => (
                <FeatureEntry key={card.id} card={card} index={i} onOpen={setOpen} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section" id="posts">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Latest signal</p>
              <h2>News, as it lands</h2>
            </div>
            <Link className="more" href="/news">
              View all news
            </Link>
          </div>
          {lead ? (
            <NewsLead item={lead} href={newsHref(lead)} />
          ) : null}
          <div className="index">
            {news.slice(1, 8).map((item) => (
              <Link key={item.id} href={newsHref(item)}>
                <time dateTime={item.publishedAt || undefined}>{item.publishedAt ? formatDate(item.publishedAt) : ""}</time>
                <span className="kind">{kindLabel(item.kind)}</span>
                <span className="name">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <CardDrawer card={open} onClose={() => setOpen(null)} />
    </main>
  );
}
