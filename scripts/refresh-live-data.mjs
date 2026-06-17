import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const OUTPUT_FILE = resolve("public/data/live-data.json");
const API_BASE = "https://worldcup26.ir/get";
const RAW_BASE = "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";

const SOURCES = {
  teams: {
    api: `${API_BASE}/teams`,
    raw: `${RAW_BASE}/football.teams.json`,
  },
  groups: {
    api: `${API_BASE}/groups`,
    raw: `${RAW_BASE}/football.matchtables.json`,
  },
  matches: {
    api: `${API_BASE}/games`,
    raw: `${RAW_BASE}/football.matches.json`,
  },
  stadiums: {
    api: `${API_BASE}/stadiums`,
    raw: `${RAW_BASE}/football.stadiums.json`,
  },
};

async function main() {
  const sourceResults = await Promise.all(
    Object.entries(SOURCES).map(async ([key, urls]) => [key, await fetchWithFallback(urls)]),
  );
  const raw = Object.fromEntries(sourceResults);
  const source = Object.values(raw).every((entry) => entry.sourceType === "api")
    ? "worldcup26-api"
    : "raw-github-fallback";

  const snapshot = normalizeSnapshot({
    generatedAt: new Date().toISOString(),
    source,
    teams: raw.teams.data,
    groups: raw.groups.data,
    matches: raw.matches.data,
    stadiums: raw.stadiums.data,
  });

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(`${OUTPUT_FILE}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(`${OUTPUT_FILE}.tmp`, OUTPUT_FILE);
  console.log(`Wrote ${OUTPUT_FILE} from ${source} at ${snapshot.generatedAt}`);
}

async function fetchWithFallback({ api, raw }) {
  try {
    return { sourceType: "api", data: await fetchJson(api, 12_000) };
  } catch (apiError) {
    console.warn(`API fetch failed for ${api}; falling back to raw GitHub. ${apiError.message}`);
    return { sourceType: "raw", data: await fetchJson(raw, 20_000) };
  }
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "world-cup-sweep-dashboard",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function collectionFromResponse(value, key) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const candidates = [
    value.data,
    value[key],
    key === "matches" ? value.games : undefined,
    key === "matches" ? value.matches : undefined,
    key === "stadiums" ? value.stadia : undefined,
    value.results,
  ];

  return candidates.find(Array.isArray) ?? [];
}

export function normalizeSnapshot(raw) {
  const rawTeams = collectionFromResponse(raw.teams, "teams");
  const rawGroups = collectionFromResponse(raw.groups, "groups");
  const rawMatches = collectionFromResponse(raw.matches, "matches");

  const teams = rawTeams.map((team, index) => ({
    id: stringValue(team.id ?? team._id?.$oid, String(index + 1)),
    name: stringValue(team.name_en ?? team.name ?? team.country, `Team ${index + 1}`),
  }));

  const groups = rawGroups.map((group) => ({
    group: stringValue(group.group ?? group.name, "?"),
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

  const matches = rawMatches.map((match, index) => {
    const finished = match.finished === true || String(match.finished).toUpperCase() === "TRUE";

    return {
      id: stringValue(match.id ?? match._id?.$oid, String(index + 1)),
      homeTeamId: stringValue(match.home_team_id ?? match.homeTeamId, ""),
      awayTeamId: stringValue(match.away_team_id ?? match.awayTeamId, ""),
      homeScore: nullableNumber(match.home_score ?? match.homeScore),
      awayScore: nullableNumber(match.away_score ?? match.awayScore),
      group: nullableString(match.group),
      matchday: nullableString(match.matchday),
      kickoff: normalizeKickoff(match.local_date ?? match.kickoff ?? null),
      stadiumId: nullableString(match.stadium_id ?? match.stadiumId),
      finished,
      status: finished ? "finished" : stringValue(match.time_elapsed ?? match.status, "notstarted"),
      type: stringValue(match.type, "group"),
    };
  });

  return {
    generatedAt: raw.generatedAt,
    source: raw.source,
    stale: false,
    teams,
    groups,
    matches,
    unmatchedTeams: [],
  };
}

function numberValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "" || value === "null") {
    return null;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(value, fallback) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function nullableString(value) {
  if (value === null || value === undefined || value === "" || value === "null") {
    return null;
  }

  return String(value);
}

function normalizeKickoff(value) {
  if (!value) {
    return null;
  }

  const apiDateMatch = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!apiDateMatch) {
    return String(value);
  }

  const [, month, day, year, hour, minute] = apiDateMatch;
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
