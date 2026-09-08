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

Patch briefings are generated during harvest from the source notes using Google's Gemini API (`gemini-3.8-flash`). Use a Google AI Studio key from a free-tier project as `GEMINI_API_KEY` in `.env.local` and the GitHub Actions repository secrets. The API uses the key's project billing tier; code cannot turn a paid project into a free one.

Set `OPENROUTER_API_KEY` for fallback through `google/gemma-4-31b-it:free`, then `openrouter/free`, which selects currently available free models supporting JSON output. Each model has one 30-second attempt. Errors, quota limits, invalid JSON and truncated output trigger fallback; if all fail, the last good summary is preserved. Visitors never call either provider and keys stay out of the browser.

Briefs are cached by source hash and model policy in `data/briefs.json`, with GitHub Actions preserving that cache between deployments. A model change regenerates old briefs, and adding the Gemini key upgrades fallback briefs on the next harvest. Static page workers read the harvested briefs without making extra AI calls.

The initial set contains five Gemini briefings and four assistant-written summaries completed from the source notes. Each page displays its summary's origin. Assistant-written summaries are preserved while their source hash is unchanged. Older patch pages display existing cached summaries without extending automatic generation to every historical release.

The footer's AI indicator reports the latest harvest: Gemini working, free fallback, partial/unavailable processing, or saved summaries. Expand it for the timestamp and counts. Cached summaries do not imply the provider was tested; this is not a live uptime monitor. It refreshes with the existing feed snapshot polling.

Static production build:

```bash
npm run build
npx serve out
```

## Attribution

- Patch notes and comm-link archive: [Star Citizen Wiki](https://starcitizen.tools) / [api.star-citizen.wiki](https://api.star-citizen.wiki)
- Roadmap, status, and funding: Roberts Space Industries public APIs
- Star Citizen® is a trademark of Cloud Imperium Games
