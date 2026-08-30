"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFeed } from "./FeedProvider";
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
  const { feed, notice, dismiss, patchHref } = useFeed();
  const [open, setOpen] = useState(false);
  const tone = statusTone(feed.status.summary);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="header">
        <div className="header-inner shell">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-mark" aria-hidden>
              CB
            </span>
            <span className="brand-name">Citizen Brief</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="tools">
            <Link
              href={patchHref({ version: feed.live.version, wikiUrl: feed.live.wikiUrl || "/patches" })}
              className="status-chip"
              title={`Universe ${statusLabel(feed.status.summary)} — open live patch notes`}
              onClick={() => setOpen(false)}
            >
              <span className={`dot ${tone}`} aria-hidden />
              <span className="status-chip-label">Alpha {feed.live.version} live</span>
            </Link>
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
          <nav className="drawer" aria-label="Primary, mobile">
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
            <p className="drawer-status">
              <span className={`dot ${tone}`} aria-hidden />
              Universe {statusLabel(feed.status.summary)} · Alpha {feed.live.version} live
            </p>
          </nav>
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
