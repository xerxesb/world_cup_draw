import { CalendarDays, Goal, Radio, Zap } from "lucide-react";
import { displayTeamName } from "../lib/display";
import type { Match, TournamentSnapshot } from "../lib/tournament";

interface MatchBoardProps {
  snapshot: TournamentSnapshot;
}

const MATCH_DURATION_MS = 2.5 * 60 * 60 * 1000; // 2.5 hours covers 90min + extra time + breaks

export function MatchBoard({ snapshot }: MatchBoardProps) {
  const teamById = new Map(snapshot.teams.map((team) => [team.id, team.name]));
  const now = Date.now();
  const sortedMatches = [...snapshot.matches].sort((a, b) => matchTime(a) - matchTime(b));

  // Live: kickoff has passed but match not finished and within 2.5h window
  const live = sortedMatches.filter((m) => {
    if (m.finished) return false;
    const t = matchTime(m);
    return t !== Number.MAX_SAFE_INTEGER && t <= now && now - t <= MATCH_DURATION_MS;
  });

  const recent = sortedMatches.filter((match) => match.finished).slice(-4).reverse();
  const upcoming = sortedMatches.filter((match) => !match.finished && matchTime(match) >= now).slice(0, 5);
  const featured = live[0] ?? upcoming[0] ?? [...recent].reverse()[0] ?? sortedMatches[0] ?? null;

  const featuredLabel = featured
    ? live.includes(featured)
      ? "Live now"
      : featured.finished
        ? "Latest result"
        : formatKickoff(featured.kickoff)
    : "Fixtures loading";

  return (
    <section className="centerStage">
      <article className="featureMatch panel">
        <div className="panelHeader compact">
          <div>
            <p className="eyebrow">{live.length > 0 ? "🔴 In progress" : "Next whistle"}</p>
            <h2>{featuredLabel}</h2>
          </div>
          <Radio aria-hidden="true" />
        </div>
        {featured ? (
          <div className="scoreboard">
            <TeamScore name={displayTeamName(teamById.get(featured.homeTeamId) ?? "TBC")} score={featured.homeScore} />
            <span className="versus">v</span>
            <TeamScore name={displayTeamName(teamById.get(featured.awayTeamId) ?? "TBC")} score={featured.awayScore} />
          </div>
        ) : (
          <p className="emptyText">No fixture data yet</p>
        )}
      </article>

      {live.length > 1 && (
        <section className="panel liveNowPanel">
          <div className="panelHeader compact">
            <h2>Also live</h2>
            <Zap aria-hidden="true" />
          </div>
          <MatchList matches={live.slice(1)} teamById={teamById} empty="" />
        </section>
      )}

      <div className="matchGrid">
        <section className="panel">
          <div className="panelHeader compact">
            <h2>Recent Results</h2>
            <Goal aria-hidden="true" />
          </div>
          <MatchList matches={recent} teamById={teamById} empty="Results will appear here" />
        </section>
        <section className="panel">
          <div className="panelHeader compact">
            <h2>Upcoming</h2>
            <CalendarDays aria-hidden="true" />
          </div>
          <MatchList matches={upcoming} teamById={teamById} empty="No upcoming fixtures found" />
        </section>
      </div>
    </section>
  );
}

function TeamScore({ name, score }: { name: string; score: number | null }) {
  return (
    <div className="teamScore">
      <span>{name}</span>
      <strong>{score ?? "-"}</strong>
    </div>
  );
}

function MatchList({
  matches,
  teamById,
  empty,
}: {
  matches: Match[];
  teamById: Map<string, string>;
  empty: string;
}) {
  if (matches.length === 0) {
    return empty ? <p className="emptyText">{empty}</p> : null;
  }

  return (
    <div className="matchList">
      {matches.map((match) => (
        <div className="matchRow" key={match.id}>
          <span>{displayTeamName(teamById.get(match.homeTeamId) ?? "TBC")}</span>
          <strong>
            {match.homeScore ?? "-"}:{match.awayScore ?? "-"}
          </strong>
          <span>{displayTeamName(teamById.get(match.awayTeamId) ?? "TBC")}</span>
          <em>{match.finished ? "FT" : formatKickoff(match.kickoff)}</em>
        </div>
      ))}
    </div>
  );
}


function matchTime(match: Match): number {
  const date = match.kickoff ? new Date(match.kickoff) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function formatKickoff(value: string | null): string {
  if (!value) {
    return "TBC";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
}
