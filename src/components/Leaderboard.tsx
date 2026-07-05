import { Trophy } from "lucide-react";
import { displayTeamName } from "../lib/display";
import type { LeaderboardRow } from "../lib/tournament";

interface LeaderboardProps {
  rows: LeaderboardRow[];
}

export function Leaderboard({ rows }: LeaderboardProps) {
  return (
    <section className="panel leaderboardPanel" aria-labelledby="leaderboard-title">
      <div className="panelHeader">
        <div>
          <p className="eyebrow">Sweep table</p>
          <h2 id="leaderboard-title">Leaderboard</h2>
        </div>
        <Trophy aria-hidden="true" />
      </div>

      <div className="leaderRows">
        {rows.map((row) => (
          <article className="leaderRow" key={row.participant}>
            <div className="rank">{row.rank}</div>
            <div className="leaderBody">
              <div className="leaderMain">
                <strong>{row.participant}</strong>
                <span>{row.activeTeams} advancing</span>
              </div>
              <div className="teamStrip">
                {row.teams.map((team) => (
                  <span
                    className={`teamChip ${team.knockoutStatus} ${team.isBonus ? "bonus" : ""}`}
                    key={`${row.participant}-${team.tier}-${team.name}`}
                    title={`${team.tier}: ${team.points} pts \u00b7 ${team.knockoutStatus}`}
                  >
                    <b>{team.tier === "Bonus" ? "+" : team.tier}</b>
                    {displayTeamName(team.name)}
                  </span>
                ))}
              </div>
            </div>
            <div className="scoreBlock">
              <strong>{row.totalPoints}</strong>
              <span>{row.groupPoints}+{row.advancementBonus}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
