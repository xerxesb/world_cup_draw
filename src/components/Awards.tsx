import { Medal } from "lucide-react";
import type { SideAward } from "../lib/data";
import type { LeaderboardRow } from "../lib/tournament";

interface AwardsProps {
  awards: SideAward[];
  leaderboard: LeaderboardRow[];
}

export function Awards({ awards, leaderboard }: AwardsProps) {
  const spreadsheetLeader = leaderboard[0]?.participant ?? "TBC";

  return (
    <section className="panel awardsPanel" aria-labelledby="awards-title">
      <div className="panelHeader compact">
        <div>
          <p className="eyebrow">Side quests</p>
          <h2 id="awards-title">Awards</h2>
        </div>
        <Medal aria-hidden="true" />
      </div>
      <div className="awardRows">
        {awards.map((award) => (
          <div className="awardRow" key={award.award}>
            <strong>{award.award}</strong>
            <span>{award.winner ?? guessAwardLeader(award.award, spreadsheetLeader)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function guessAwardLeader(award: string, spreadsheetLeader: string): string {
  if (award === "Spreadsheet Champion") {
    return spreadsheetLeader;
  }

  return "TBC";
}
