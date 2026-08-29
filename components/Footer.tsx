"use client";

import { formatDateTime } from "@/lib/format";
import { useFeed, useSyncedLabel } from "./FeedProvider";

export function Footer() {
  const { feed, refresh, refreshing } = useFeed();
  const label = useSyncedLabel();

  return (
    <footer className="footer">
      <div className="shell footer-grid">
        <div>
          <strong style={{ color: "var(--ivory)", letterSpacing: "0.14em", fontSize: 12 }}>
            CITIZEN BRIEF
          </strong>
          <p>
            An unofficial live briefing for Star Citizen. Patches, the public
            roadmap, and RSI transmissions are pulled automatically from official
            Cloud Imperium sources and the Star Citizen Wiki.
          </p>
          <p className="sync">
            {label}
            {" · "}
            Last harvest {formatDateTime(feed.fetchedAt)}
            {" · "}
            <button
              type="button"
              onClick={() => refresh()}
              disabled={refreshing}
              style={{
                background: "none",
                border: 0,
                color: "var(--gold)",
                padding: 0,
              }}
            >
              Refresh now
            </button>
          </p>
        </div>
        <div>
          <strong style={{ color: "var(--muted)" }}>Official sources</strong>
          <p>
            <a href="https://robertsspaceindustries.com" target="_blank" rel="noreferrer">
              Roberts Space Industries
            </a>
            <br />
            <a href="https://robertsspaceindustries.com/roadmap/release-view" target="_blank" rel="noreferrer">
              Public roadmap
            </a>
            <br />
            <a href="https://status.robertsspaceindustries.com" target="_blank" rel="noreferrer">
              RSI status
            </a>
          </p>
        </div>
        <div>
          <strong style={{ color: "var(--muted)" }}>Attribution</strong>
          <p>
            Game data and comm-links via{" "}
            <a href="https://starcitizen.tools" target="_blank" rel="noreferrer">
              Star Citizen Wiki
            </a>
            . Star Citizen® is a trademark of Cloud Imperium Games. This site is
            not affiliated with CIG or RSI.
          </p>
        </div>
      </div>
    </footer>
  );
}
