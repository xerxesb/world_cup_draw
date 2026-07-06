import { Swords } from "lucide-react";
import { InfoTooltip } from "./InfoTooltip";
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
          <h2 id="knockout-title">
            Knockout Watch
            <InfoTooltip
              label="How Knockout Watch is scored"
              text="Ranks people by how many knockout matches their owned teams have won (penalty shootouts count as wins). Ties are broken by having the champion, then teams still alive, then name. This is separate from the frozen Sweep leaderboard above and doesn't change its points."
            />
          </h2>
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
