import { describe, expect, it } from "vitest";
import {
  buildAdvancingTeamIds,
  buildLeaderboard,
  normalizeSnapshot,
  normalizeTeamName,
  type Allocation,
  type Match,
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

// Helper to create a minimal Match fixture
function makeMatch(
  overrides: Partial<Match> & Pick<Match, "id" | "homeTeamId" | "awayTeamId" | "type">,
): Match {
  return {
    homeScore: null,
    awayScore: null,
    group: null,
    matchday: null,
    kickoff: null,
    stadiumId: null,
    finished: false,
    status: "notstarted",
    ...overrides,
  };
}

describe("buildAdvancingTeamIds", () => {
  it("returns null when there are no knockout matches", () => {
    const matches = [
      makeMatch({ id: "1", homeTeamId: "1", awayTeamId: "2", type: "group", finished: true, homeScore: 2, awayScore: 1 }),
    ];
    expect(buildAdvancingTeamIds(matches)).toBeNull();
  });

  it("returns null when all knockout fixtures have placeholder '0' team IDs", () => {
    const matches = [
      makeMatch({ id: "1", homeTeamId: "0", awayTeamId: "0", type: "r32" }),
    ];
    expect(buildAdvancingTeamIds(matches)).toBeNull();
  });

  it("includes all teams with real IDs in r32 fixtures, including 3rd-place qualifiers", () => {
    const matches = [
      makeMatch({ id: "1", homeTeamId: "1", awayTeamId: "3", type: "r32" }), // 3rd-place qualifier "3"
      makeMatch({ id: "2", homeTeamId: "2", awayTeamId: "4", type: "r32" }),
    ];
    const result = buildAdvancingTeamIds(matches);
    expect(result).not.toBeNull();
    expect([...result!].sort()).toEqual(["1", "2", "3", "4"]);
  });

  it("marks the definitive loser of a finished knockout match as eliminated", () => {
    const matches = [
      makeMatch({ id: "1", homeTeamId: "1", awayTeamId: "2", type: "r32", finished: true, homeScore: 2, awayScore: 1 }),
      makeMatch({ id: "2", homeTeamId: "3", awayTeamId: "4", type: "r32" }),
    ];
    const result = buildAdvancingTeamIds(matches);
    expect(result).toContain("1");   // winner
    expect(result).not.toContain("2"); // loser
    expect(result).toContain("3");
    expect(result).toContain("4");
  });

  it("infers the penalty loser from fixture counts when a knockout match is drawn", () => {
    // Team "1" drew with "2" in R32, then "1" appears in R16 → "1" won on penalties
    const matches = [
      makeMatch({ id: "1", homeTeamId: "1", awayTeamId: "2", type: "r32", finished: true, homeScore: 1, awayScore: 1 }),
      makeMatch({ id: "2", homeTeamId: "1", awayTeamId: "5", type: "r16" }), // "1" advances
    ];
    const result = buildAdvancingTeamIds(matches);
    expect(result).toContain("1");
    expect(result).not.toContain("2"); // "2" lost on penalties
  });

  it("leaves both draw opponents as advancing when penalty winner cannot be determined yet", () => {
    // Draw with no subsequent fixtures yet scheduled
    const matches = [
      makeMatch({ id: "1", homeTeamId: "1", awayTeamId: "2", type: "r32", finished: true, homeScore: 1, awayScore: 1 }),
    ];
    const result = buildAdvancingTeamIds(matches);
    expect(result).toContain("1");
    expect(result).toContain("2");
  });

  it("handles the 'knockout' generic type from the fallback data source", () => {
    const matches = [
      makeMatch({ id: "1", homeTeamId: "1", awayTeamId: "2", type: "knockout", finished: true, homeScore: 3, awayScore: 0 }),
    ];
    const result = buildAdvancingTeamIds(matches);
    expect(result).toContain("1");
    expect(result).not.toContain("2");
  });

  it("does not eliminate an SF loser who still has an unfinished third-place match", () => {
    const matches = [
      makeMatch({ id: "sf1", homeTeamId: "1", awayTeamId: "2", type: "sf", finished: true, homeScore: 2, awayScore: 1 }),
      makeMatch({ id: "sf2", homeTeamId: "3", awayTeamId: "4", type: "sf", finished: true, homeScore: 3, awayScore: 1 }),
      makeMatch({ id: "3rd", homeTeamId: "2", awayTeamId: "4", type: "third" }), // unfinished
      makeMatch({ id: "fin", homeTeamId: "1", awayTeamId: "3", type: "final" }), // unfinished
    ];
    const result = buildAdvancingTeamIds(matches);
    // All four teams still have a match to play
    expect(result).toContain("1");
    expect(result).toContain("2");
    expect(result).toContain("3");
    expect(result).toContain("4");
  });
});

describe("buildLeaderboard with knockout stage", () => {
  const allocations: Allocation[] = [
    {
      participant: "Alex",
      tierA: "France",
      tierB: "Czechia",
      tierC: "DR Congo",
      bonus: ["Paraguay"],
    },
  ];

  // France pos 1, Czechia pos 2, DR Congo pos 3, Paraguay pos 4 — all in group A
  const teamsAndGroups: Pick<TournamentSnapshot, "teams" | "groups"> = {
    teams: [
      { id: "1", name: "France" },
      { id: "2", name: "Czech Republic" },
      { id: "3", name: "Congo DR" },
      { id: "4", name: "Paraguay" },
      { id: "5", name: "Germany" },
    ],
    groups: [
      {
        group: "A",
        teams: [
          { teamId: "1", played: 3, won: 3, drawn: 0, lost: 0, goalsFor: 6, goalsAgainst: 1, goalDifference: 5, points: 9, position: 1 },
          { teamId: "2", played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 4, position: 2 },
          { teamId: "3", played: 3, won: 1, drawn: 0, lost: 2, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 3, position: 3 },
          { teamId: "4", played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 4, goalDifference: -3, points: 0, position: 4 },
        ],
      },
      {
        group: "B",
        teams: [
          { teamId: "5", played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, points: 6, position: 1 },
        ],
      },
    ],
  };

  it("marks a 3rd-place team as advancing when they qualify for r32", () => {
    // DR Congo (pos 3) qualifies as best-3rd, Paraguay (pos 4) does not
    const snapshot: TournamentSnapshot = {
      generatedAt: "2026-07-01T00:00:00.000Z",
      source: "test",
      stale: false,
      ...teamsAndGroups,
      matches: [
        makeMatch({ id: "r32-1", homeTeamId: "1", awayTeamId: "5", type: "r32" }), // France vs Germany
        makeMatch({ id: "r32-2", homeTeamId: "2", awayTeamId: "3", type: "r32" }), // Czechia vs DR Congo (3rd-place qualifier)
      ],
      unmatchedTeams: [],
    };

    const [leader] = buildLeaderboard(allocations, snapshot);
    const teamMap = Object.fromEntries(leader.teams.map((t) => [t.name, t]));

    expect(teamMap["France"].advancing).toBe(true);
    expect(teamMap["Czechia"].advancing).toBe(true);
    expect(teamMap["DR Congo"].advancing).toBe(true);  // 3rd-place qualifier
    expect(teamMap["Paraguay"].advancing).toBe(false); // did not qualify
  });

  it("marks a group winner as not advancing after they are eliminated in r32", () => {
    // France (pos 1) loses R32 to Germany 0-2
    const snapshot: TournamentSnapshot = {
      generatedAt: "2026-07-01T00:00:00.000Z",
      source: "test",
      stale: false,
      ...teamsAndGroups,
      matches: [
        makeMatch({ id: "r32-1", homeTeamId: "1", awayTeamId: "5", type: "r32", finished: true, homeScore: 0, awayScore: 2 }),
        makeMatch({ id: "r32-2", homeTeamId: "2", awayTeamId: "3", type: "r32" }),
      ],
      unmatchedTeams: [],
    };

    const [leader] = buildLeaderboard(allocations, snapshot);
    const teamMap = Object.fromEntries(leader.teams.map((t) => [t.name, t]));

    expect(teamMap["France"].advancing).toBe(false); // eliminated in R32
    expect(teamMap["Czechia"].advancing).toBe(true);
    expect(teamMap["DR Congo"].advancing).toBe(true);
  });
});
