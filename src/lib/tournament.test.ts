import { describe, expect, it } from "vitest";
import {
  buildLeaderboard,
  normalizeSnapshot,
  normalizeTeamName,
  type Allocation,
  type RawApiSnapshot,
  type TournamentSnapshot,
} from "./tournament";

describe("normalizeTeamName", () => {
  it.each([
    ["DR Congo", "dr congo"],
    ["Congo DR", "dr congo"],
    ["Democratic Republic of Congo", "dr congo"],
    ["Czechia", "czechia"],
    ["Czech Republic", "czechia"],
    ["Turkey", "turkiye"],
    ["Turkiye", "turkiye"],
    ["Curaçao", "curacao"],
    ["Curacao", "curacao"],
    ["United States", "usa"],
    ["USA", "usa"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeTeamName(input)).toBe(expected);
  });
});

describe("buildLeaderboard", () => {
  const allocations: Allocation[] = [
    {
      participant: "Alex",
      tierA: "France",
      tierB: "Czechia",
      tierC: "DR Congo",
      bonus: ["Paraguay"],
    },
    {
      participant: "Blair",
      tierA: "Brazil",
      tierB: "Turkey",
      tierC: "Ghana",
      bonus: [],
    },
    {
      participant: "Casey",
      tierA: "Argentina",
      tierB: "Japan",
      tierC: "Qatar",
      bonus: [],
    },
  ];

  const snapshot: TournamentSnapshot = {
    generatedAt: "2026-06-17T00:00:00.000Z",
    source: "test",
    stale: false,
    teams: [
      { id: "1", name: "France" },
      { id: "2", name: "Czech Republic" },
      { id: "3", name: "Congo DR" },
      { id: "4", name: "Paraguay" },
      { id: "5", name: "Brazil" },
      { id: "6", name: "Turkiye" },
      { id: "7", name: "Ghana" },
      { id: "8", name: "Argentina" },
      { id: "9", name: "Japan" },
      { id: "10", name: "Qatar" },
    ],
    groups: [
      {
        group: "A",
        teams: [
          { teamId: "1", played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1, goalDifference: 4, points: 6, position: 1 },
          { teamId: "2", played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 2, goalDifference: 1, points: 4, position: 2 },
          { teamId: "3", played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 1, position: 3 },
          { teamId: "4", played: 2, won: 0, drawn: 0, lost: 2, goalsFor: 1, goalsAgainst: 4, goalDifference: -3, points: 0, position: 4 },
        ],
      },
      {
        group: "B",
        teams: [
          { teamId: "5", played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 3, goalsAgainst: 1, goalDifference: 2, points: 4, position: 1 },
          { teamId: "6", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 2, goalDifference: 0, points: 3, position: 2 },
          { teamId: "7", played: 2, won: 0, drawn: 2, lost: 0, goalsFor: 2, goalsAgainst: 2, goalDifference: 0, points: 2, position: 3 },
          { teamId: "8", played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 1, position: 4 },
        ],
      },
      {
        group: "C",
        teams: [
          { teamId: "9", played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 2, goalsAgainst: 2, goalDifference: 0, points: 3, position: 2 },
          { teamId: "10", played: 2, won: 0, drawn: 0, lost: 2, goalsFor: 0, goalsAgainst: 5, goalDifference: -5, points: 0, position: 4 },
        ],
      },
    ],
    matches: [],
    unmatchedTeams: [],
  };

  it("scores regular and bonus teams using group-table points plus advancement bonuses", () => {
    const [leader] = buildLeaderboard(allocations, snapshot);

    expect(leader.participant).toBe("Alex");
    expect(leader.groupPoints).toBe(11);
    expect(leader.advancementBonus).toBe(6);
    expect(leader.totalPoints).toBe(17);
    expect(leader.teams).toEqual([
      expect.objectContaining({ name: "France", points: 6, advancing: true }),
      expect.objectContaining({ name: "Czechia", points: 4, advancing: true }),
      expect.objectContaining({ name: "DR Congo", points: 1, advancing: false }),
      expect.objectContaining({ name: "Paraguay", points: 0, isBonus: true }),
    ]);
  });

  it("ranks by total points, active teams, best single team, then participant name", () => {
    const rows = buildLeaderboard(allocations, snapshot);

    expect(rows.map((row) => row.participant)).toEqual(["Alex", "Blair", "Casey"]);
    expect(rows.map((row) => row.rank)).toEqual([1, 2, 3]);
  });

  it("marks a team eliminated after it loses a finished knockout match", () => {
    const snapshotWithKnockouts: TournamentSnapshot = {
      ...snapshot,
      matches: [
        {
          id: "201",
          homeTeamId: "1",
          awayTeamId: "99",
          homeScore: 1,
          awayScore: 2,
          group: null,
          matchday: "Round of 16",
          kickoff: null,
          stadiumId: null,
          finished: true,
          status: "finished",
          type: "knockout",
        },
      ],
    };

    const [alex] = buildLeaderboard(allocations, snapshotWithKnockouts);
    const france = alex.teams.find((team) => team.name === "France");

    expect(france?.knockoutStatus).toBe("eliminated");
  });

  it("marks a team champion after it wins a finished Final match", () => {
    const snapshotWithKnockouts: TournamentSnapshot = {
      ...snapshot,
      matches: [
        {
          id: "202",
          homeTeamId: "2",
          awayTeamId: "98",
          homeScore: 3,
          awayScore: 1,
          group: null,
          matchday: "Final",
          kickoff: null,
          stadiumId: null,
          finished: true,
          status: "finished",
          type: "knockout",
        },
      ],
    };

    const [alex] = buildLeaderboard(allocations, snapshotWithKnockouts);
    const czechia = alex.teams.find((team) => team.name === "Czechia");

    expect(czechia?.knockoutStatus).toBe("champion");
  });

  it("marks a team already out of the running (didn't qualify from groups) as eliminated", () => {
    const [alex] = buildLeaderboard(allocations, snapshot);
    const drCongo = alex.teams.find((team) => team.name === "DR Congo");

    expect(drCongo?.knockoutStatus).toBe("eliminated");
  });

  it("keeps a qualified team alive while its knockout match is unfinished or undecided", () => {
    const snapshotWithKnockouts: TournamentSnapshot = {
      ...snapshot,
      matches: [
        {
          id: "203",
          homeTeamId: "5",
          awayTeamId: "97",
          homeScore: null,
          awayScore: null,
          group: null,
          matchday: "Round of 16",
          kickoff: null,
          stadiumId: null,
          finished: false,
          status: "notstarted",
          type: "knockout",
        },
        {
          id: "204",
          homeTeamId: "9",
          awayTeamId: "96",
          homeScore: 1,
          awayScore: 1,
          group: null,
          matchday: "Round of 16",
          kickoff: null,
          stadiumId: null,
          finished: true,
          status: "finished",
          type: "knockout",
        },
      ],
    };

    const [, blair, casey] = buildLeaderboard(allocations, snapshotWithKnockouts);
    const brazil = blair.teams.find((team) => team.name === "Brazil");
    const japan = casey.teams.find((team) => team.name === "Japan");

    expect(brazil?.knockoutStatus).toBe("alive");
    expect(japan?.knockoutStatus).toBe("alive");
  });

  it("marks a team eliminated when a tied knockout match is decided on penalties", () => {
    const snapshotWithKnockouts: TournamentSnapshot = {
      ...snapshot,
      matches: [
        {
          id: "205",
          homeTeamId: "1",
          awayTeamId: "99",
          homeScore: 1,
          awayScore: 1,
          homePenalties: 3,
          awayPenalties: 4,
          group: null,
          matchday: "Round of 16",
          kickoff: null,
          stadiumId: null,
          finished: true,
          status: "finished",
          type: "knockout",
        },
      ],
    };

    const [alex] = buildLeaderboard(allocations, snapshotWithKnockouts);
    const france = alex.teams.find((team) => team.name === "France");

    expect(france?.knockoutStatus).toBe("eliminated");
  });
});

describe("normalizeSnapshot", () => {
  it("normalizes raw teams, groups and matches from the public API shape", () => {
    const raw: RawApiSnapshot = {
      source: "fixture",
      generatedAt: "2026-06-17T00:00:00.000Z",
      teams: [
        { id: "1", name_en: "Mexico" },
        { id: "2", name_en: "South Africa" },
      ],
      groups: [
        {
          group: "A",
          teams: [
            { team_id: "1", mp: "1", w: "1", d: "0", l: "0", gf: "3", ga: "1", gd: "2", pts: "3" },
            { team_id: "2", mp: "1", w: "0", d: "0", l: "1", gf: "1", ga: "3", gd: "-2", pts: "0" },
          ],
        },
      ],
      matches: [
        {
          id: "1",
          home_team_id: "1",
          away_team_id: "2",
          home_score: "3",
          away_score: "1",
          group: "A",
          matchday: "1",
          local_date: "06/11/2026 13:00",
          stadium_id: "4",
          finished: "TRUE",
          time_elapsed: "finished",
          type: "group",
        },
      ],
    };

    const snapshot = normalizeSnapshot(raw);

    expect(snapshot.teams).toEqual([
      { id: "1", name: "Mexico" },
      { id: "2", name: "South Africa" },
    ]);
    expect(snapshot.groups[0].teams[0]).toEqual({
      teamId: "1",
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goalsFor: 3,
      goalsAgainst: 1,
      goalDifference: 2,
      points: 3,
      position: 1,
    });
    expect(snapshot.matches[0]).toEqual(
      expect.objectContaining({
        id: "1",
        homeTeamId: "1",
        awayTeamId: "2",
        homeScore: 3,
        awayScore: 1,
        finished: true,
        status: "finished",
      }),
    );
  });
});
