"use client";

import Link from "next/link";
import { useState } from "react";
import type { RoadmapCard } from "@/lib/types";
import {
  formatDate,
  formatMoney,
  formatNumber,
  kindLabel,
  relativeTime,
  statusLabel,
  statusTone,
} from "@/lib/format";
import { useFeed } from "./FeedProvider";
import { CardDrawer } from "./RoadmapBoard";
import { FeatureEntry } from "./FeatureEntry";

export function HomeView() {
  const { feed } = useFeed();
  const { live, status, stats, news, roadmap } = feed;
  const features = roadmap.current?.cards || [];
  const nextRel = roadmap.upcoming[0];
  const lead = news[0];
  const [open, setOpen] = useState<RoadmapCard | null>(null);
  const needle = live.title.replace(/['"]/g, "").toLowerCase();
  const leadIndex = Math.max(
    0,
    features.findIndex((c) => needle && c.name.toLowerCase().includes(needle.split(" ")[0] || needle)),
  );
  const leadFeature = features[leadIndex] || features[0];
  const rest = features.filter((_, i) => i !== leadIndex);

  return (
    <main id="content">
      <section className="folio">
        <div className="shell">
          <nav className="jump" aria-label="On this page">
            <a href="#patch">Patch notes</a>
            <a href="#in-patch">In this patch</a>
            {nextRel ? <a href="#next">Coming next</a> : null}
            <a href="#posts">Transmissions</a>
          </nav>

          <div className="spread">
            <div>
              <p className="eyebrow">Live environment</p>
              <h1>Alpha {live.version}</h1>
              <p className="title">{live.title}</p>
              <p className="lede">{live.summary}</p>
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
              <div className="actions" id="patch">
                <Link className="btn primary" href={`/patches/${live.version}`}>
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
            <figure className="portrait">
              {live.image ? <img src={live.image} alt={live.title} /> : <div className="ph" />}
              <figcaption>Official roadmap still · Roberts Space Industries</figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="section" id="in-patch">
        <div className="shell">
          <div className="section-head">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>What shipped in {live.version}</h2>
              <p>Each deliverable with its official still. Open one for the full brief.</p>
            </div>
            <Link className="more" href="/roadmap">
              Full roadmap
            </Link>
          </div>
          {leadFeature ? (
            <FeatureEntry card={leadFeature} index={0} featured onOpen={setOpen} />
          ) : null}
          <div className="feature-stack">
            {rest.map((card, i) => (
              <FeatureEntry key={card.id} card={card} index={i + 1} onOpen={setOpen} />
            ))}
          </div>
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
              {nextRel.cards.slice(0, 10).map((card, i) => (
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
              <p className="eyebrow">From RSI</p>
              <h2>Latest transmissions</h2>
            </div>
            <Link className="more" href="/news">
              All posts
            </Link>
          </div>
          {lead ? (
            <Link href={`/news/${lead.id}`} className="lead-story">
              {lead.image ? <img src={lead.image} alt="" /> : <div className="ph" />}
              <div>
                <span className="kind">{kindLabel(lead.kind)}</span>
                <h3>{lead.title}</h3>
                <p>{lead.excerpt}</p>
              </div>
            </Link>
          ) : null}
          <div className="index">
            {news.slice(1, 8).map((item) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <time>{item.publishedAt ? relativeTime(item.publishedAt) : ""}</time>
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
