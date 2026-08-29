"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { useFeed, useSyncedLabel } from "./FeedProvider";

export function Footer() {
  const { feed, refresh, refreshing } = useFeed();
  const label = useSyncedLabel();

  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <p className="brand-name" style={{ fontSize: 28, margin: "0 0 8px" }}>
            Citizen<em> Brief</em>
          </p>
          <p>
            Unofficial live briefing for Star Citizen. Patches, the public roadmap, and
            RSI transmissions are harvested automatically. Not affiliated with Cloud
            Imperium Games.
          </p>
          <p className="sync">
            {label} · Last harvest {formatDateTime(feed.fetchedAt)} ·{" "}
            <button
              type="button"
              onClick={() => refresh()}
              disabled={refreshing}
              style={{
                background: "none",
                border: 0,
                color: "var(--oxide)",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Refresh now
            </button>
          </p>
        </div>
        <div>
          <strong style={{ color: "var(--ink)" }}>Find</strong>
          <p>
            <Link href="/patches">Patch notes</Link>
            <br />
            <Link href="/roadmap">Roadmap</Link>
            <br />
            <Link href="/news">Transmissions</Link>
          </p>
        </div>
        <div>
          <strong style={{ color: "var(--ink)" }}>Sources</strong>
          <p>
            <a href="https://robertsspaceindustries.com" target="_blank" rel="noreferrer">
              Roberts Space Industries
            </a>
            <br />
            <a href="https://robertsspaceindustries.com/roadmap/release-view" target="_blank" rel="noreferrer">
              Public roadmap
            </a>
            <br />
            <a href="https://starcitizen.tools" target="_blank" rel="noreferrer">
              Star Citizen Wiki
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
