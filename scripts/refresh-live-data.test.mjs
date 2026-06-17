import { describe, expect, it } from "vitest";
import { collectionFromResponse, normalizeSnapshot } from "./refresh-live-data.mjs";

describe("collectionFromResponse", () => {
  it("accepts raw arrays and common API envelope shapes", () => {
    expect(collectionFromResponse([{ id: "1" }], "teams")).toEqual([{ id: "1" }]);
    expect(collectionFromResponse({ data: [{ id: "2" }] }, "teams")).toEqual([{ id: "2" }]);
    expect(collectionFromResponse({ teams: [{ id: "3" }] }, "teams")).toEqual([{ id: "3" }]);
    expect(collectionFromResponse({ games: [{ id: "4" }] }, "matches")).toEqual([{ id: "4" }]);
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
