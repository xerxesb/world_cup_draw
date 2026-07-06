import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Awards } from "./Awards";
import type { SideAward } from "../lib/data";
import type { LeaderboardRow } from "../lib/tournament";

const awards: SideAward[] = [
  {
    award: "Chaos Merchant",
    meaning: "For backing the underdog behind the tournament's biggest shock result.",
    winnerRule: "Owns the biggest upset",
    winner: null,
  },
  {
    award: "Spreadsheet Champion",
    meaning: "For quietly out-scoring everyone across all three teams.",
    winnerRule: "Person whose teams earn the most total points",
    winner: null,
  },
];

const leaderboard: LeaderboardRow[] = [];

describe("Awards", () => {
  it("shows what each award means and how its winner is decided in the info bubble", () => {
    render(<Awards awards={awards} leaderboard={leaderboard} />);

    fireEvent.focus(screen.getByRole("button", { name: "How side awards are decided" }));

    const tooltip = screen.getByRole("tooltip");
    for (const award of awards) {
      expect(tooltip).toHaveTextContent(award.award);
      expect(tooltip).toHaveTextContent(award.meaning);
      expect(tooltip).toHaveTextContent(award.winnerRule);
    }
  });
});
