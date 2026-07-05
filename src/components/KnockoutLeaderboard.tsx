import { Swords } from "lucide-react";
import type { KnockoutLeaderboardRow } from "../lib/tournament";

interface KnockoutLeaderboardProps {
  rows: KnockoutLeaderboardRow[];
}

export function KnockoutLeaderboard({ rows }: KnockoutLeaderboardProps) {
  return (
    <section className="panel knockoutPanel" aria-labelledby="knockout-title">
      <div className="panelHeader compact">
        <div>
          <p className="eyebrow">Bracket progress</p>
          <h2 id="knockout-title">Knockout Watch</h2>
        </div>
        <Swords aria-hidden="true" />
      </div>
      <div className="knockoutRows">
        {rows.map((row) => (
          <div className="knockoutRow" key={row.participant}>
            <span className="knockoutRank">{row.rank}</span>
            <strong>{row.participant}</strong>
            <span className="knockoutStat">
              {row.championCount > 0 ? "Champion" : `${row.aliveCount} alive`}
            </span>
            <b>{row.knockoutWins}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
