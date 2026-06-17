# World Cup Sweep Dashboard

A single-screen office TV dashboard for the no-money World Cup sweep.

## What It Shows

- Sweep leaderboard scored from owned-team group-table points.
- Advancement bonus of `3` points for each owned team currently in a top-two group position.
- Owned teams by participant, including bonus teams.
- Featured next fixture, upcoming matches, recent results, relevant group tables, and side awards.
- Live/stale data status and last snapshot time.

## Local Run

```bash
npm install
npm run refresh:data
npm run dev
```

Open the local URL printed by Vite.

## Data

- Fixed draw data: `public/data/allocations.json`
- Editable side awards: `public/data/side-awards.json`
- Live tournament snapshot: `public/data/live-data.json`

The refresh script tries the public API documented by [rezarahiminia/worldcup2026](https://github.com/rezarahiminia/worldcup2026), then falls back to that repository's raw JSON files when the API is unavailable.

Refresh manually:

```bash
npm run refresh:data
```

## Deployment

This repo is configured for GitHub Pages.

- `.github/workflows/deploy-pages.yml` builds and deploys the dashboard on pushes to `main`.
- `.github/workflows/refresh-data.yml` refreshes `public/data/live-data.json` every 15 minutes and commits changes.

In GitHub, enable Pages with **Source: GitHub Actions**.

## Side Awards

Edit `public/data/side-awards.json`. Set `"winner"` to a name when an award is decided; leave it as `null` while it is still in play.
