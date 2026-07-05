# Knockout Status on Leaderboard Team Chips — Design

Date: 2026-07-06

## Problem

`LeaderboardTeam.advancing` reflects only group-stage qualification (top-2
finish) and is frozen once the group stage ends — it also drives the
`advancementBonus`/`activeTeams` scoring, which must not change. Once the
knockout rounds start, a team's chip on the Leaderboard panel looks identical
whether that team is still alive or has since been eliminated in the Round of
32/16/quarter-finals/etc. There is no visual way to tell who is still in the
competition.

## Goals

- Show, per owned team chip on the Leaderboard panel, whether that team is
  still alive in the knockout stage, has been eliminated, or has won the
  tournament.
- Do not change the sweep scoring model (`groupPoints`, `advancementBonus`,
  `totalPoints`, `activeTeams` all stay based on group qualification, as
  today).
- Do not change anywhere other than the Leaderboard chips (no change to the
  per-participant "X advancing" summary text).

## Data model (`src/lib/tournament.ts`)

- Add `export type KnockoutStatus = "alive" | "eliminated" | "champion";`
- Add `knockoutStatus: KnockoutStatus` to `LeaderboardTeam`. The existing
  `advancing` field is untouched and keeps driving scoring.
- Add a helper `computeKnockoutOutcomes(snapshot): { eliminatedTeamIds:
  Set<string>; championTeamId: string | null }` that scans
  `snapshot.matches`:
  - Only considers matches where `type === "knockout" && finished === true`.
  - Skips matches where `homeScore`/`awayScore` are null or equal (can't
    infer a penalty-shootout winner from this data model — treated as
    undecided).
  - For each decisive match, adds the losing `teamId` to `eliminatedTeamIds`.
  - If the match's `matchday === "Final"`, records the winning `teamId` as
    `championTeamId`.
- In `buildLeaderboard`, for each owned team compute `knockoutStatus`:
  1. If the team isn't matched to a snapshot team, or its group standing
     position is not 1 or 2 (i.e. `advancing` is `false`) → `"eliminated"`.
  2. Else if the matched snapshot team id equals `championTeamId` →
     `"champion"`.
  3. Else if the matched snapshot team id is in `eliminatedTeamIds` →
     `"eliminated"`.
  4. Else → `"alive"`.

## UI (`src/components/Leaderboard.tsx`, `src/styles.css`)

- The team chip's status class is driven by `knockoutStatus` instead of the
  current `advancing`/plain split:
  - `alive` → keep today's green highlight look (same visual as the current
    `.teamChip.advancing` style).
  - `eliminated` → dimmed/muted style (reduced opacity, grey border) so it
    reads as "out".
  - `champion` → distinct gold/highlight accent.
- The chip's `title` tooltip appends the status, e.g. `A: 6 pts · eliminated`.
- The bonus-tier chip styling (`.teamChip.bonus`) is unaffected and continues
  to layer on top of the status class.
- The per-participant `"{activeTeams} advancing"` summary text and all point
  totals are unchanged.

## Testing

- `src/lib/tournament.test.ts`: add cases for a team that loses a finished
  knockout match (`eliminated`), a team that wins a `"Final"` knockout match
  (`champion`), and a team with an undecided/upcoming knockout match
  (`alive`).
- `src/App.test.tsx` / Leaderboard render tests updated if they assert on
  team chip fields.

## Out of scope

- No change to group-stage scoring, `advancementBonus`, or `activeTeams`.
- No change to the Awards or GroupTables panels.
- No handling of penalty-shootout results beyond treating a tied finished
  knockout score as undecided (`alive`).
