import { describe, expect, it, vi } from "vitest";
import { loadDashboardData } from "./data";

describe("loadDashboardData", () => {
  it("loads allocations, awards, snapshot and computed leaderboard", async () => {
    const fetcher = vi.fn(async (url: string) => {
      const responses: Record<string, unknown> = {
        "allocations.json": [
          {
            participant: "Alex",
            tierA: "Mexico",
            tierB: "South Africa",
            tierC: "Ghana",
            bonus: [],
          },
        ],
        "side-awards.json": [
          { award: "Spreadsheet Champion", winnerRule: "Most total points", winner: null },
        ],
        "live-data.json": {
          generatedAt: "2026-06-17T00:00:00.000Z",
          source: "test",
          stale: false,
          teams: [
            { id: "1", name: "Mexico" },
            { id: "2", name: "South Africa" },
            { id: "3", name: "Ghana" },
          ],
          groups: [
            {
              group: "A",
              teams: [
                { teamId: "1", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 1, goalDifference: 2, points: 3, position: 1 },
                { teamId: "2", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0, position: 2 },
                { teamId: "3", played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, position: 3 },
              ],
            },
          ],
          matches: [],
          unmatchedTeams: [],
        },
      };

      return {
        ok: true,
        json: async () => responses[url.split("/").at(-1) ?? ""],
      } as Response;
    });

    const data = await loadDashboardData(fetcher);

    expect(data.leaderboard[0]).toEqual(expect.objectContaining({
      participant: "Alex",
      groupPoints: 3,
      advancementBonus: 6,
      totalPoints: 9,
    }));
    expect(data.status).toEqual(expect.objectContaining({ liveDataAvailable: true, stale: false }));
  });

  it("keeps the dashboard usable when the live snapshot cannot be loaded", async () => {
    const fetcher = vi.fn(async (url: string) => {
      if (url.endsWith("live-data.json")) {
        return { ok: false, status: 404, json: async () => ({}) } as Response;
      }

      const responses: Record<string, unknown> = {
        "allocations.json": [
          {
            participant: "Alex",
            tierA: "Mexico",
            tierB: "South Africa",
            tierC: "Ghana",
            bonus: [],
          },
        ],
        "side-awards.json": [],
      };

      return {
        ok: true,
        json: async () => responses[url.split("/").at(-1) ?? ""],
      } as Response;
    });

    const data = await loadDashboardData(fetcher);

    expect(data.allocations).toHaveLength(1);
    expect(data.leaderboard[0].totalPoints).toBe(0);
    expect(data.status).toEqual(expect.objectContaining({ liveDataAvailable: false, stale: true }));
  });
});
