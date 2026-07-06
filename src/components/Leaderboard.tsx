import { Trophy } from "lucide-react";
import { displayTeamName } from "../lib/display";
import { InfoTooltip } from "./InfoTooltip";
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
          <h2 id="leaderboard-title">
            Leaderboard
            <InfoTooltip
              label="How the sweep leaderboard is scored"
              text="Each person owns 3 tiered teams (A/B/C) plus any bonus teams. Points = each team's group-stage points, plus +3 for every owned team that reached the knockout rounds. This table froze when the group stage ended; ties are broken by teams still advancing, then best single-team score."
            />
          </h2>
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
