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
  const { feed, newsHref, patchHref } = useFeed();
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
            <span>Briefing index</span>
            <a href="#patch">Live build</a>
            <a href="#in-patch">What shipped</a>
            {nextRel ? <a href="#next">Coming next</a> : null}
            <a href="#posts">Latest news</a>
          </nav>

          <div className="spread">
            <div>
              <p className="eyebrow"><span className="live-pulse" /> Current live build</p>
              <h1><span>Alpha</span> {live.version}</h1>
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
              <p className="eyebrow">Inside the update</p>
              <h2>What changed in {live.version}</h2>
              <p>Official deliverables, translated into a quick, scannable briefing.</p>
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
              <p className="eyebrow">Latest signal</p>
              <h2>News, as it lands</h2>
            </div>
            <Link className="more" href="/news">
              View all news
            </Link>
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
          ) : null}
          <div className="index">
            {news.slice(1, 8).map((item) => (
              <Link key={item.id} href={newsHref(item)}>
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
