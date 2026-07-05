import { describe, expect, it } from "vitest";
import {
  collectionFromResponse,
  normalizeApiSnapshot as normalizeSnapshot,
  normalizeOpenfootball,
} from "./refresh-live-data.mjs";

describe("collectionFromResponse", () => {
  it("accepts raw arrays and common API envelope shapes", () => {
    expect(collectionFromResponse([{ id: "1" }], "teams")).toEqual([{ id: "1" }]);
    expect(collectionFromResponse({ data: [{ id: "2" }] }, "teams")).toEqual([{ id: "2" }]);
    expect(collectionFromResponse({ teams: [{ id: "3" }] }, "teams")).toEqual([{ id: "3" }]);
    expect(collectionFromResponse({ games: [{ id: "4" }] }, "matches")).toEqual([{ id: "4" }]);
  });
});

describe("normalizeOpenfootball", () => {
  it("captures penalty shootout scores for knockout matches decided on penalties", () => {
    const snapshot = normalizeOpenfootball(
      {
        matches: [
          {
            round: "Round of 32",
            date: "2026-06-29",
            time: "16:30 UTC-4",
            team1: "Germany",
            team2: "Paraguay",
            score: { p: [3, 4], et: [1, 1], ft: [1, 1], ht: [0, 1] },
          },
        ],
      },
      "2026-07-05T00:00:00.000Z",
    );

    expect(snapshot.matches[0]).toEqual(
      expect.objectContaining({
        homeScore: 1,
        awayScore: 1,
        homePenalties: 3,
        awayPenalties: 4,
        finished: true,
        type: "knockout",
      }),
    );
  });

  it("leaves penalties null for matches without a shootout", () => {
    const snapshot = normalizeOpenfootball(
      {
        matches: [
          {
            round: "Matchday 1",
            date: "2026-06-11",
            time: "13:00 UTC-6",
            team1: "Mexico",
            team2: "South Africa",
            group: "Group A",
            score: { ft: [2, 0], ht: [1, 0] },
          },
        ],
      },
      "2026-07-05T00:00:00.000Z",
    );

    expect(snapshot.matches[0]).toEqual(
      expect.objectContaining({ homePenalties: null, awayPenalties: null }),
    );
  });
});

describe("normalizeSnapshot", () => {
  it("normalizes mixed API envelopes and raw fallback arrays", () => {
    const snapshot = normalizeSnapshot({
      generatedAt: "2026-06-17T00:00:00.000Z",
      source: "mixed",
      teams: { data: [{ id: "1", name_en: "Mexico" }] },
      groups: [
        {
          group: "A",
          teams: [{ team_id: "1", mp: "1", w: "1", d: "0", l: "0", gf: "2", ga: "0", gd: "2", pts: "3" }],
        },
      ],
      matches: { games: [{ id: "1", home_team_id: "1", away_team_id: "2", finished: "FALSE" }] },
      stadiums: { data: [] },
    });

    expect(snapshot.teams).toEqual([{ id: "1", name: "Mexico" }]);
    expect(snapshot.groups[0].teams[0].points).toBe(3);
    expect(snapshot.matches[0]).toEqual(expect.objectContaining({ id: "1", homeTeamId: "1" }));
  });
});
