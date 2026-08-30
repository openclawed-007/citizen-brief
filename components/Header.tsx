"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFeed, useSyncedLabel } from "./FeedProvider";
import { SearchControl } from "./Search";
import { ThemeToggle } from "./Theme";
import { statusLabel, statusTone } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Latest" },
  { href: "/news", label: "News" },
  { href: "/patches", label: "Patches" },
  { href: "/roadmap", label: "Roadmap" },
];

export function Header() {
  const pathname = usePathname();
  const { feed, notice, dismiss, refresh, refreshing } = useFeed();
  const [open, setOpen] = useState(false);
  const tone = statusTone(feed.status.summary);
  const synced = useSyncedLabel();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div className="ticker">
        <div className="ticker-inner">
          <span>
            <span className={`dot ${tone === "ok" ? "" : tone}`} />
            LIVE {feed.live.version}
          </span>
          <span>
            Universe <b>{statusLabel(feed.status.summary)}</b>
          </span>
          {feed.status.systems.map((s) => (
            <span key={s.name}>
              {s.name} {s.status === "operational" ? "ok" : s.status}
            </span>
          ))}
          <button type="button" onClick={() => refresh()} disabled={refreshing}>
            {refreshing ? "Checking…" : synced}
          </button>
        </div>
      </div>
      <header className="header">
        <div className="mast">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-name">
              <span className="brand-mark" aria-hidden>CB</span>
              Citizen Brief
            </span>
            <span className="brand-issue">Star Citizen intelligence · Alpha {feed.live.version}</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="tools">
            <SearchControl />
            <ThemeToggle />
            <button
              className="menu-btn"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
        {open ? (
          <div className="drawer">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={isActive(l.href) ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
        ) : null}
      </header>
      {notice ? (
        <div className="notice" role="status">
          <div className="notice-inner">
            <span>{notice}</span>
            <button type="button" onClick={dismiss} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
