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

1. **GitHub Actions** rebuilds the site every 20 minutes (and on every push), making this single scheduled job the only consumer of RSI and Wiki APIs.
2. **Open tabs** revalidate the site-owned `feed.json` at most every five minutes, only while visible and online. Failed checks use exponential backoff up to one hour.
3. **Refresh now** checks the deployed snapshot without contacting upstream services. New builds and posts appear with an update banner after the next successful deployment.

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
