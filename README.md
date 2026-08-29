# Citizen Brief

A live Star Citizen briefing desk. It watches official Cloud Imperium / RSI sources and the Star Citizen Wiki, then updates itself when a new patch, roadmap roundup, or comm-link is published.

**Live site:** [https://openclawed-007.github.io/citizen-brief/](https://openclawed-007.github.io/citizen-brief/)

This is an unofficial fan site. It is not affiliated with Cloud Imperium Games or Roberts Space Industries.

## What it shows

- **Live environment** — current Alpha version, build string, and publish date
- **Patch notes** — full notes for each live build, from the official RSI patch comm-link via the Star Citizen Wiki
- **Public roadmap** — Release View cards for the current patch, the next patch, and Star Citizen 1.0
- **Official information** — RSI transmissions, roadmap roundups, weekly reports, and letters from the chairman
- **Platform status** — Persistent Universe / Arena Commander / platform from the RSI status page
- **Citizen & funding totals** — from the public RSI crowdfunding stats API

## How auto-update works

1. **GitHub Actions** rebuilds the site every 20 minutes (and on every push), harvesting RSI + Wiki data into a fresh static snapshot.
2. **The open tab** checks `feed.json` plus the public Star Citizen Wiki API every 60 seconds. New live builds and comm-links appear in place, with a banner when official information changes.
3. **Refresh now** in the footer forces an immediate harvest from the browser.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Static production build:

```bash
npm run build
npx serve out
```

## Attribution

- Patch notes and comm-link archive: [Star Citizen Wiki](https://starcitizen.tools) / [api.star-citizen.wiki](https://api.star-citizen.wiki)
- Roadmap, status, and funding: Roberts Space Industries public APIs
- Star Citizen® is a trademark of Cloud Imperium Games
