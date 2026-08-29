"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFeed } from "./FeedProvider";
import { statusTone } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Briefing" },
  { href: "/patches", label: "Patches" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/news", label: "Official" },
];

export function Header() {
  const pathname = usePathname();
  const { feed, notice, dismiss } = useFeed();
  const [open, setOpen] = useState(false);
  const tone = statusTone(feed.status.summary);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="header">
        <div className="header-inner">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            <svg className="mark" viewBox="0 0 36 36" aria-hidden>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <ellipse cx="18" cy="18" rx="15.5" ry="6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
              <circle cx="18" cy="18" r="2.4" fill="currentColor" />
            </svg>
            <span>
              <span className="brand-name">Citizen Brief</span>
              <span className="brand-sub">Live official desk</span>
            </span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? "active" : ""}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="live-chip" title={feed.status.summary}>
            <span className={`pulse ${tone === "ok" ? "" : tone}`} />
            LIVE {feed.live.version}
          </div>
          <button
            className="menu-btn"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
        {open ? (
          <div className="drawer">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? "nav-link active" : "nav-link"}
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
            <span className="pulse" />
            <span>{notice}</span>
            <button type="button" onClick={dismiss} aria-label="Dismiss">
              ×
            </button>
          </div>
        </div>
      ) : null}
      <nav className="bottom-nav" aria-label="Mobile">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
