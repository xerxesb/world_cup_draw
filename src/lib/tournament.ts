export interface Allocation {
  participant: string;
  tierA: string;
  tierB: string;
  tierC: string;
  bonus: string[];
}

export interface Team {
  id: string;
  name: string;
}

export interface GroupStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

export interface GroupTable {
  group: string;
  teams: GroupStanding[];
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  group: string | null;
  matchday: string | null;
  kickoff: string | null;
  stadiumId: string | null;
  finished: boolean;
  status: string;
  type: string;
}

export interface TournamentSnapshot {
  generatedAt: string;
  source: string;
  stale: boolean;
  teams: Team[];
  groups: GroupTable[];
  matches: Match[];
  unmatchedTeams: string[];
}

export interface RawApiTeam {
  id?: string;
  name?: string;
  name_en?: string;
}

export interface RawApiGroupStanding {
  team_id?: string;
  teamId?: string;
  mp?: string | number;
  played?: string | number;
  w?: string | number;
  won?: string | number;
  d?: string | number;
  drawn?: string | number;
  l?: string | number;
  lost?: string | number;
  gf?: string | number;
  goalsFor?: string | number;
  ga?: string | number;
  goalsAgainst?: string | number;
  gd?: string | number;
  goalDifference?: string | number;
  pts?: string | number;
  points?: string | number;
}

export interface RawApiGroup {
  group?: string;
  teams?: RawApiGroupStanding[];
}

export interface RawApiMatch {
  id?: string;
  home_team_id?: string;
  away_team_id?: string;
  homeScore?: string | number | null;
  awayScore?: string | number | null;
  home_score?: string | number | null;
  away_score?: string | number | null;
  group?: string | null;
  matchday?: string | null;
  local_date?: string | null;
  kickoff?: string | null;
  stadium_id?: string | null;
  finished?: string | boolean;
  time_elapsed?: string | null;
  type?: string;
}

export interface RawApiSnapshot {
  generatedAt?: string;
  source?: string;
  stale?: boolean;
  teams?: RawApiTeam[];
  groups?: RawApiGroup[];
  matches?: RawApiMatch[];
}

export type KnockoutStatus = "alive" | "eliminated" | "champion";

export interface LeaderboardTeam {
  name: string;
  tier: "A" | "B" | "C" | "Bonus";
  points: number;
  goalDifference: number;
  position: number | null;
  group: string | null;
  advancing: boolean;
  knockoutStatus: KnockoutStatus;
  isBonus: boolean;
  matched: boolean;
}

export interface LeaderboardRow {
  rank: number;
  participant: string;
  groupPoints: number;
  advancementBonus: number;
  totalPoints: number;
  activeTeams: number;
  bestTeamPoints: number;
  teams: LeaderboardTeam[];
}

const TEAM_ALIASES = new Map<string, string>([
  ["congo dr", "dr congo"],
  ["democratic republic of congo", "dr congo"],
  ["d r congo", "dr congo"],
  ["czech republic", "czechia"],
  ["turkey", "turkiye"],
  ["türkiye", "turkiye"],
  ["curaçao", "curacao"],
  ["curacao", "curacao"],
  ["united states", "usa"],
  ["u s a", "usa"],
  ["u.s.a", "usa"],
  ["usa", "usa"],
]);

export function normalizeTeamName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return TEAM_ALIASES.get(normalized) ?? normalized;
}

export function normalizeSnapshot(raw: RawApiSnapshot): TournamentSnapshot {
  const teams = (raw.teams ?? []).map((team, index) => ({
    id: stringValue(team.id, String(index + 1)),
    name: stringValue(team.name_en ?? team.name, `Team ${index + 1}`),
  }));

  const groups = (raw.groups ?? []).map((group) => ({
    group: stringValue(group.group, "?"),
    teams: (group.teams ?? []).map((team, index) => ({
      teamId: stringValue(team.team_id ?? team.teamId, String(index + 1)),
      played: numberValue(team.mp ?? team.played),
      won: numberValue(team.w ?? team.won),
      drawn: numberValue(team.d ?? team.drawn),
      lost: numberValue(team.l ?? team.lost),
      goalsFor: numberValue(team.gf ?? team.goalsFor),
      goalsAgainst: numberValue(team.ga ?? team.goalsAgainst),
      goalDifference: numberValue(team.gd ?? team.goalDifference),
      points: numberValue(team.pts ?? team.points),
      position: index + 1,
    })),
  }));

  const matches = (raw.matches ?? []).map((match, index) => {
    const finished = match.finished === true || String(match.finished).toUpperCase() === "TRUE";

    return {
      id: stringValue(match.id, String(index + 1)),
      homeTeamId: stringValue(match.home_team_id, ""),
      awayTeamId: stringValue(match.away_team_id, ""),
      homeScore: nullableNumber(match.home_score ?? match.homeScore),
      awayScore: nullableNumber(match.away_score ?? match.awayScore),
      group: match.group ?? null,
      matchday: match.matchday ?? null,
      kickoff: normalizeKickoff(match.local_date ?? match.kickoff ?? null),
      stadiumId: match.stadium_id ?? null,
      finished,
      status: finished ? "finished" : stringValue(match.time_elapsed, "notstarted"),
      type: stringValue(match.type, "group"),
    };
  });

  return {
    generatedAt: raw.generatedAt ?? new Date().toISOString(),
    source: raw.source ?? "unknown",
    stale: raw.stale ?? false,
    teams,
    groups,
    matches,
    unmatchedTeams: [],
  };
}

export function buildLeaderboard(
  allocations: Allocation[],
  snapshot: TournamentSnapshot,
): LeaderboardRow[] {
  const teamsByName = new Map(snapshot.teams.map((team) => [normalizeTeamName(team.name), team]));
  const standingByTeamId = new Map<string, { group: string; standing: GroupStanding }>();
  const { eliminatedTeamIds, championTeamId } = computeKnockoutOutcomes(snapshot);

  snapshot.groups.forEach((group) => {
    group.teams.forEach((standing) => {
      standingByTeamId.set(standing.teamId, { group: group.group, standing });
    });
  });

  const rows = allocations.map((allocation) => {
    const ownedTeams = [
      { name: allocation.tierA, tier: "A" as const, isBonus: false },
      { name: allocation.tierB, tier: "B" as const, isBonus: false },
      { name: allocation.tierC, tier: "C" as const, isBonus: false },
      ...allocation.bonus.map((name) => ({ name, tier: "Bonus" as const, isBonus: true })),
    ];

    const teams = ownedTeams.map(({ name, tier, isBonus }) => {
      const matchedTeam = teamsByName.get(normalizeTeamName(name));
      const groupInfo = matchedTeam ? standingByTeamId.get(matchedTeam.id) : undefined;
      const standing = groupInfo?.standing;
      const advancing = standing ? standing.position <= 2 : false;

      const knockoutStatus: KnockoutStatus = !advancing
        ? "eliminated"
        : matchedTeam?.id === championTeamId
          ? "champion"
          : matchedTeam && eliminatedTeamIds.has(matchedTeam.id)
            ? "eliminated"
            : "alive";

      return {
        name,
        tier,
        points: standing?.points ?? 0,
        goalDifference: standing?.goalDifference ?? 0,
        position: standing?.position ?? null,
        group: groupInfo?.group ?? null,
        advancing,
        knockoutStatus,
        isBonus,
        matched: Boolean(matchedTeam && standing),
      };
    });


    const groupPoints = teams.reduce((sum, team) => sum + team.points, 0);
    const advancementBonus = teams.filter((team) => team.advancing).length * 3;
    const activeTeams = teams.filter((team) => team.advancing).length;
    const bestTeamPoints = Math.max(0, ...teams.map((team) => team.points));

    return {
      rank: 0,
      participant: allocation.participant,
      groupPoints,
      advancementBonus,
      totalPoints: groupPoints + advancementBonus,
      activeTeams,
      bestTeamPoints,
      teams,
    };
  });

  rows.sort((a, b) => {
    return (
      b.totalPoints - a.totalPoints ||
      b.activeTeams - a.activeTeams ||
      b.bestTeamPoints - a.bestTeamPoints ||
      a.participant.localeCompare(b.participant)
    );
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

function computeKnockoutOutcomes(snapshot: TournamentSnapshot): {
  eliminatedTeamIds: Set<string>;
  championTeamId: string | null;
} {
  const eliminatedTeamIds = new Set<string>();
  let championTeamId: string | null = null;

  snapshot.matches.forEach((match) => {
    if (match.type !== "knockout" || !match.finished) {
      return;
    }

    if (match.homeScore === null || match.awayScore === null) {
      return;
    }

    let winnerId: string;
    let loserId: string;

    if (match.homeScore !== match.awayScore) {
      winnerId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
      loserId = match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;
    } else if (
      match.homePenalties != null &&
      match.awayPenalties != null &&
      match.homePenalties !== match.awayPenalties
    ) {
      winnerId = match.homePenalties > match.awayPenalties ? match.homeTeamId : match.awayTeamId;
      loserId = match.homePenalties > match.awayPenalties ? match.awayTeamId : match.homeTeamId;
    } else {
      // Tied with no (or no decisive) penalty-shootout data; treat as undecided.
      return;
    }

    eliminatedTeamIds.add(loserId);

    if (match.matchday === "Final") {
      championTeamId = winnerId;
    }
  });

  return { eliminatedTeamIds, championTeamId };
}

function numberValue(value: string | number | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "" || value === "null") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(value: string | number | null | undefined, fallback: string): string {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function normalizeKickoff(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const apiDateMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!apiDateMatch) {
    return value;
  }

  const [, month, day, year, hour, minute] = apiDateMatch;
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}
