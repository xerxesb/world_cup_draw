import { displayTeamName } from "../lib/display";
import { InfoTooltip } from "./InfoTooltip";
import type { LeaderboardRow, TournamentSnapshot } from "../lib/tournament";

interface GroupTablesProps {
  snapshot: TournamentSnapshot;
  leaderboard: LeaderboardRow[];
}

export function GroupTables({ snapshot, leaderboard }: GroupTablesProps) {
  const teamById = new Map(snapshot.teams.map((team) => [team.id, team.name]));
  const ownedTeamNames = new Set(
    leaderboard.flatMap((row) => row.teams.map((team) => team.name.toLowerCase())),
  );

  const relevantGroups = [...snapshot.groups]
    .sort((a, b) => relevanceScore(b, teamById, ownedTeamNames) - relevanceScore(a, teamById, ownedTeamNames))
    .slice(0, 4);

  return (
    <section className="panel groupPanel" aria-labelledby="groups-title">
      <div className="panelHeader compact">
        <div>
          <p className="eyebrow">Owned-team groups</p>
          <h2 id="groups-title">
            Tables
            <InfoTooltip
              label="How group standings work"
              text="Final group-stage standings: position, goal difference, and points. Top 2 in each group advanced to the knockout rounds. Showing the groups with the most owned teams first."
            />
          </h2>
        </div>
      </div>
      <div className="groupGrid">
        {relevantGroups.map((group) => (
          <article className="groupTable" key={group.group}>
            <h3>{group.group.startsWith("Group ") ? group.group : `Group ${group.group}`}</h3>
            {group.teams.slice(0, 4).map((standing) => {
              const name = teamById.get(standing.teamId) ?? standing.teamId;
              const owned = ownedTeamNames.has(name.toLowerCase());
              return (
                <div className={`standingRow ${owned ? "owned" : ""}`} key={standing.teamId}>
                  <span>{standing.position}</span>
                  <strong>{displayTeamName(name)}</strong>
                  <em>{standing.goalDifference >= 0 ? `+${standing.goalDifference}` : standing.goalDifference}</em>
                  <b>{standing.points}</b>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}

function relevanceScore(
  group: TournamentSnapshot["groups"][number],
  teamById: Map<string, string>,
  ownedTeamNames: Set<string>,
): number {
  return group.teams.reduce((score, standing) => {
    const name = teamById.get(standing.teamId);
    return score + (name && ownedTeamNames.has(name.toLowerCase()) ? 1 : 0);
  }, 0);
}
