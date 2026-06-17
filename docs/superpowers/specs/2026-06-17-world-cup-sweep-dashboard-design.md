# World Cup Sweep Dashboard Design

## Goal

Build a single-screen, no-scroll office TV dashboard for the no-money World Cup sweep. It should show draw allocations, live standings/results, upcoming fixtures, a sweep leaderboard, and side awards with minimal maintenance.

## Scope

- A static web app deployed through GitHub Pages.
- Live tournament data fetched by a scheduled GitHub Actions workflow and stored as a checked-in JSON snapshot.
- Browser-side fallback to bundled snapshot data if upstream APIs fail.
- A leaderboard that scores each participant by the group-table points earned by all assigned teams, plus advancement bonuses when knockout status becomes available.
- Side awards rendered from editable local data so they can be invented during the tournament.

## Architecture

The app is a Vite React app. GitHub Pages serves the static build. A GitHub Actions workflow runs on a schedule, fetches World Cup data from public endpoints, normalizes it into `public/data/live-data.json`, and commits the refreshed snapshot. The dashboard reads that local snapshot first, then optionally tries direct API refresh in the browser when CORS allows it.

The primary public source is the open-source World Cup 2026 API project at `https://github.com/rezarahiminia/worldcup2026`, which documents `games`, `groups`, `teams`, and `stadiums` data. Raw GitHub JSON files are used as a stable fallback because they are accessible without an API key.

## Data Model

- `public/data/allocations.json`: fixed sweep draw results from `world_cup_sweep_results.csv`.
- `public/data/side-awards.json`: editable side-award definitions and optional winners.
- `public/data/live-data.json`: latest normalized tournament snapshot.
- `src/lib/tournament.ts`: pure normalization and scoring logic.
- `src/lib/data.ts`: browser fetch orchestration and fallback handling.
- `src/components/*`: display-only dashboard panels.

## Dashboard Layout

The dashboard is designed for a 16:9 office display without scrolling.

- Header strip: title, live/stale status, next refresh time, tournament progress.
- Left rail: sweep leaderboard with participant rank, teams, total points, and bonus markers.
- Center stage: current/live match or next match, recent results, and upcoming fixtures.
- Right rail: compact group tables for groups with sweep relevance and side awards.
- Footer ticker: draw fairness note, frozen-tier reminder, and rotating fun facts.

The visual direction should feel like a broadcast control room crossed with an office sweep wall: dense, legible, mildly chaotic, and not like a marketing landing page.

## Scoring

- Group-stage table points: sum `pts` for every team owned by the participant.
- Bonus teams count the same as regular assigned teams.
- Advancement bonus, when derivable: add `3` for each team confirmed in knockout places.
- Tie break: more owned teams still active, then highest single-team points, then participant name.

## Error Handling

- If the scheduled updater fails, the previous `live-data.json` remains in place.
- The dashboard displays a stale-data badge with the last successful refresh time.
- If live data has no scores yet, the dashboard still shows the draw, groups, upcoming fixtures, and awards.
- If a team name cannot be matched between draw data and live data, the app lists it in diagnostics and excludes it from scoring rather than crashing.

## Deployment

- GitHub Pages deploys from the `gh-pages` artifact built by the GitHub Actions Pages workflow.
- A separate scheduled workflow refreshes `public/data/live-data.json` every 15 minutes during the tournament.
- The repository can be created under the user's GitHub account once authenticated push access is available.

## Testing

- Unit tests cover allocation parsing, team-name normalization, leaderboard scoring, ranking tie breaks, and live-data normalization.
- A production build must pass before deployment.
- A local browser check must verify the dashboard fits a 16:9 viewport without scrolling.
