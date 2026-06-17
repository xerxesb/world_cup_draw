# World Cup Sweep Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a live GitHub Pages dashboard for the office World Cup sweep.

**Architecture:** Create a Vite React static app. Keep tournament scoring and data normalization in pure TypeScript modules with Vitest coverage. Use GitHub Actions to refresh a local JSON snapshot and deploy the static build to GitHub Pages.

**Tech Stack:** Vite, React, TypeScript, Vitest, GitHub Actions, GitHub Pages.

## Global Constraints

- The dashboard must fit one 16:9 display without page scrolling.
- The source of truth for sweep allocations is `world_cup_sweep_results.csv`.
- Live data must be API-first with a local snapshot fallback.
- GitHub Pages is the deployment target.
- Maintenance should be minimal after initial publication.

---

### Task 1: Project Skeleton And Static Data

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/test/setup.ts`
- Create: `public/data/allocations.json`
- Create: `public/data/side-awards.json`

**Interfaces:**
- Produces static JSON consumed by Task 2 and UI consumed by Task 4.

- [ ] Write package/config files for Vite React, TypeScript, and Vitest.
- [ ] Convert `world_cup_sweep_results.csv` into `public/data/allocations.json`.
- [ ] Convert the supplied side-awards image content into `public/data/side-awards.json`.
- [ ] Run `npm install`.
- [ ] Run `npm test -- --run`; expected initial state is no tests found or passing config smoke test.

### Task 2: Tournament Scoring Logic

**Files:**
- Create: `src/lib/tournament.ts`
- Create: `src/lib/tournament.test.ts`

**Interfaces:**
- Produces `normalizeTeamName(name: string): string`.
- Produces `buildLeaderboard(allocations, groups, matches): LeaderboardRow[]`.
- Produces `normalizeSnapshot(raw): TournamentSnapshot`.

- [ ] Write failing tests for name aliases such as `DR Congo`, `Congo DR`, `Czechia`, `Czech Republic`, `Turkey`, and `Turkiye`.
- [ ] Implement minimal name normalization.
- [ ] Write failing tests for participant scoring including bonus teams.
- [ ] Implement leaderboard scoring and tie breaks.
- [ ] Write failing tests for snapshot normalization from raw API files.
- [ ] Implement snapshot normalization.
- [ ] Run `npm test -- --run`.

### Task 3: Data Fetch And Snapshot Refresh

**Files:**
- Create: `scripts/refresh-live-data.mjs`
- Create: `public/data/live-data.json`
- Create: `src/lib/data.ts`
- Create: `.github/workflows/refresh-data.yml`

**Interfaces:**
- Produces `loadDashboardData(): Promise<DashboardData>`.
- Produces a normalized `public/data/live-data.json`.

- [ ] Write failing tests for browser fallback behavior.
- [ ] Implement `loadDashboardData`.
- [ ] Implement the Node refresh script using raw GitHub JSON fallback and public API primary URLs.
- [ ] Add a scheduled GitHub Actions workflow that runs the refresh script and commits changed data.
- [ ] Run `node scripts/refresh-live-data.mjs`.
- [ ] Run `npm test -- --run`.

### Task 4: Single-Screen Dashboard UI

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/components/Leaderboard.tsx`
- Create: `src/components/MatchBoard.tsx`
- Create: `src/components/GroupTables.tsx`
- Create: `src/components/Awards.tsx`
- Create: `src/components/Ticker.tsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes `loadDashboardData()`.
- Renders one no-scroll dashboard at 1920x1080 and responsive fallbacks.

- [ ] Write component tests for leaderboard rendering and stale-data badge.
- [ ] Implement the UI with compact panels and stable dimensions.
- [ ] Add refresh polling in the browser every five minutes.
- [ ] Run `npm test -- --run`.
- [ ] Run `npm run build`.
- [ ] Verify in a browser at 1920x1080 and 1366x768 with no body scroll.

### Task 5: GitHub Pages Deployment

**Files:**
- Create: `.github/workflows/deploy-pages.yml`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces GitHub Pages build artifact from `npm run build`.

- [ ] Add a GitHub Pages deployment workflow using `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.
- [ ] Add README instructions for local run, data refresh, awards editing, and deployment.
- [ ] Initialize git if needed.
- [ ] Commit the dashboard.
- [ ] Create/push to a GitHub repository when authenticated access is available.
- [ ] Confirm the GitHub Pages URL loads.
