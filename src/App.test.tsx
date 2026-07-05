import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import type { DashboardData } from "./lib/data";

const dashboardData: DashboardData = {
  allocations: [
    { participant: "Alex Gardner", tierA: "Belgium", tierB: "South Korea", tierC: "Uzbekistan", bonus: [] },
  ],
  awards: [
    { award: "Spreadsheet Champion", winnerRule: "Person whose teams earn the most total points", winner: null },
  ],
  snapshot: {
    generatedAt: "2026-06-17T00:00:00.000Z",
    source: "test",
    stale: true,
    teams: [
      { id: "1", name: "Belgium" },
      { id: "2", name: "South Korea" },
    ],
    groups: [
      {
        group: "A",
        teams: [
          { teamId: "1", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 3, position: 1 },
          { teamId: "2", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: -2, points: 0, position: 2 },
        ],
      },
    ],
    matches: [],
    unmatchedTeams: [],
  },
  leaderboard: [
    {
      rank: 1,
      participant: "Alex Gardner",
      groupPoints: 3,
      advancementBonus: 6,
      totalPoints: 9,
      activeTeams: 2,
      bestTeamPoints: 3,
      teams: [
        { name: "Belgium", tier: "A", points: 3, goalDifference: 2, position: 1, group: "A", advancing: true, knockoutStatus: "alive", isBonus: false, matched: true },
        { name: "South Korea", tier: "B", points: 0, goalDifference: -2, position: 2, group: "A", advancing: true, knockoutStatus: "alive", isBonus: false, matched: true },
        { name: "Uzbekistan", tier: "C", points: 0, goalDifference: 0, position: null, group: null, advancing: false, knockoutStatus: "eliminated", isBonus: false, matched: false },
      ],
    },
  ],
  status: {
    liveDataAvailable: true,
    stale: true,
    loadedAt: "2026-06-17T00:01:00.000Z",
    message: "Live snapshot loaded",
  },
};

describe("App", () => {
  it("renders the leaderboard and stale-data status for the TV dashboard", () => {
    render(<App initialData={dashboardData} />);

    expect(screen.getByRole("heading", { name: "ES WC Sweep" })).toBeInTheDocument();
    expect(screen.getAllByText("Alex Gardner").length).toBeGreaterThan(0);
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText(/stale/i)).toBeInTheDocument();
    expect(screen.getByText("Spreadsheet Champion")).toBeInTheDocument();
    expect(screen.getByAltText("Cochlear")).toBeInTheDocument();
  });
});
