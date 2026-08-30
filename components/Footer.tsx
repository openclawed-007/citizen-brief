"use client";

import Link from "next/link";
import { formatDateTime, statusLabel, statusTone } from "@/lib/format";
import { useFeed, useSyncedLabel } from "./FeedProvider";

export function Footer() {
  const { feed, refresh, refreshing } = useFeed();
  const label = useSyncedLabel();

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-about">
            <span className="brand-name">Citizen Brief</span>
            <p>
              Unofficial live briefing for Star Citizen. Patches, the public roadmap, and
              RSI transmissions are harvested automatically.
            </p>
            <p className="sync">
              {label} · Last harvest {formatDateTime(feed.fetchedAt)} ·{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => refresh()}
                disabled={refreshing}
              >
                Refresh now
              </button>
            </p>
          </div>
          <nav aria-label="Browse">
            <strong>Browse</strong>
            <ul className="footer-list">
              <li>
                <Link href="/patches">Patch notes</Link>
              </li>
              <li>
                <Link href="/roadmap">Roadmap</Link>
              </li>
              <li>
                <Link href="/news">News</Link>
              </li>
            </ul>
          </nav>
          <div>
            <strong>Sources</strong>
            <ul className="footer-list">
              <li>
                <a href="https://robertsspaceindustries.com" target="_blank" rel="noreferrer">
                  Roberts Space Industries
                </a>
              </li>
              <li>
                <a
                  href="https://robertsspaceindustries.com/roadmap/release-view"
                  target="_blank"
                  rel="noreferrer"
                >
                  Public roadmap
                </a>
              </li>
              <li>
                <a href="https://starcitizen.tools" target="_blank" rel="noreferrer">
                  Star Citizen Wiki
                </a>
              </li>
            </ul>
          </div>
          <div>
            <strong>Service status</strong>
            <ul className="footer-list">
              <li>
                <span className={`dot ${statusTone(feed.status.summary)}`} aria-hidden />
                Universe {statusLabel(feed.status.summary)}
              </li>
              {feed.status.systems.map((s) => (
                <li key={s.name}>
                  <span className={`dot ${statusTone(s.status)}`} aria-hidden />
                  {s.name} {statusLabel(s.status)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="footer-note">
          Fan-made project. Not affiliated with or endorsed by Cloud Imperium Games. Star
          Citizen® is a registered trademark of Cloud Imperium Rights LLC.
        </p>
      </div>
    </footer>
  );
}
