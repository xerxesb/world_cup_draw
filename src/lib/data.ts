import { buildLeaderboard, type Allocation, type LeaderboardRow, type TournamentSnapshot } from "./tournament";

export interface SideAward {
  award: string;
  meaning: string;
  winnerRule: string;
  winner: string | null;
}

export interface DashboardStatus {
  liveDataAvailable: boolean;
  stale: boolean;
  loadedAt: string;
  message: string;
}

export interface DashboardData {
  allocations: Allocation[];
  awards: SideAward[];
  snapshot: TournamentSnapshot;
  leaderboard: LeaderboardRow[];
  status: DashboardStatus;
}

export type JsonFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function loadDashboardData(
  fetcher: JsonFetcher = fetch,
  basePath = `${import.meta.env.BASE_URL}data`,
): Promise<DashboardData> {
  const normalizedBase = basePath.replace(/\/$/, "");
  const cacheToken = Date.now();
  const [allocations, awards, liveSnapshot] = await Promise.all([
    fetchJson<Allocation[]>(fetcher, cacheBustedUrl(`${normalizedBase}/allocations.json`, cacheToken)),
    fetchJson<SideAward[]>(fetcher, cacheBustedUrl(`${normalizedBase}/side-awards.json`, cacheToken)),
    fetchJson<TournamentSnapshot>(fetcher, cacheBustedUrl(`${normalizedBase}/live-data.json`, cacheToken)).catch(() => null),
  ]);

  const snapshot = liveSnapshot ?? makeEmptySnapshot();
  const stale = Boolean(snapshot.stale || !liveSnapshot);

  return {
    allocations,
    awards,
    snapshot: {
      ...snapshot,
      stale,
    },
    leaderboard: buildLeaderboard(allocations, snapshot),
    status: {
      liveDataAvailable: Boolean(liveSnapshot),
      stale,
      loadedAt: new Date().toISOString(),
      message: liveSnapshot ? "Live snapshot loaded" : "Live snapshot unavailable; showing draw only",
    },
  };
}

async function fetchJson<T>(fetcher: JsonFetcher, url: string): Promise<T> {
  const response = await fetcher(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function cacheBustedUrl(url: string, cacheToken: number): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${cacheToken}`;
}

function makeEmptySnapshot(): TournamentSnapshot {
  return {
    generatedAt: new Date(0).toISOString(),
    source: "empty-fallback",
    stale: true,
    teams: [],
    groups: [],
    matches: [],
    unmatchedTeams: [],
  };
}
