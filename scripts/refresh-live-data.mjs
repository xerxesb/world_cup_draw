import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const OUTPUT_FILE = resolve("public/data/live-data.json");
const API_BASE = "https://worldcup26.ir/get";
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/world-cup.json/master/2026/worldcup.json";

const API_SOURCES = {
  teams: `${API_BASE}/teams`,
  groups: `${API_BASE}/groups`,
  matches: `${API_BASE}/games`,
};

async function main() {
  // Try the worldcup26.ir API first (has live standings)
  try {
    const [teamsResult, groupsResult, matchesResult] = await Promise.all([
      fetchJson(API_SOURCES.teams, 12_000),
      fetchJson(API_SOURCES.groups, 12_000),
      fetchJson(API_SOURCES.matches, 12_000),
    ]);

    const snapshot = normalizeApiSnapshot({
      generatedAt: new Date().toISOString(),
      source: "worldcup26-api",
      teams: teamsResult,
      groups: groupsResult,
      matches: matchesResult,
    });

    await writeSnapshot(snapshot);
    console.log(`Wrote ${OUTPUT_FILE} from worldcup26-api at ${snapshot.generatedAt}`);
    return;
  } catch (apiError) {
    console.warn(`worldcup26.ir API failed; falling back to openfootball. ${apiError.message}`);
  }

  // Fall back to openfootball (has actual match results, compute standings from results)
  const data = await fetchJson(OPENFOOTBALL_URL, 20_000);
  const snapshot = normalizeOpenfootball(data, new Date().toISOString());
  await writeSnapshot(snapshot);
  console.log(`Wrote ${OUTPUT_FILE} from openfootball at ${snapshot.generatedAt}`);
}

async function writeSnapshot(snapshot) {
  await mkdir(dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(`${OUTPUT_FILE}.tmp`, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(`${OUTPUT_FILE}.tmp`, OUTPUT_FILE);
}

// ── openfootball normalizer ──────────────────────────────────────────────────

export function normalizeOpenfootball(data, generatedAt) {
  const rawMatches = data.matches ?? [];

  // Collect teams in order of appearance
  const teamNames = [];
  const teamSet = new Set();
  rawMatches.forEach((m) => {
    const t1 = normalizeName(m.team1);
    const t2 = normalizeName(m.team2);
    if (!teamSet.has(t1)) { teamSet.add(t1); teamNames.push(t1); }
    if (!teamSet.has(t2)) { teamSet.add(t2); teamNames.push(t2); }
  });

  const teams = teamNames.map((name, i) => ({ id: String(i + 1), name }));
  const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));

  // Compute group standings from match results
  const groupOrder = [];
  const groupTeams = {}; // group → [teamName]
  const stats = {}; // teamName → { played, won, drawn, lost, gf, ga }

  rawMatches.forEach((m) => {
    if (!m.group) return;
    const g = m.group;
    const t1 = normalizeName(m.team1);
    const t2 = normalizeName(m.team2);

    if (!groupTeams[g]) { groupTeams[g] = []; groupOrder.push(g); }
    if (!groupTeams[g].includes(t1)) groupTeams[g].push(t1);
    if (!groupTeams[g].includes(t2)) groupTeams[g].push(t2);

    for (const t of [t1, t2]) {
      if (!stats[t]) stats[t] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
    }

    if (m.score?.ft) {
      const [h, a] = m.score.ft;
      stats[t1].played++; stats[t2].played++;
      stats[t1].gf += h; stats[t1].ga += a;
      stats[t2].gf += a; stats[t2].ga += h;
      if (h > a) { stats[t1].won++; stats[t2].lost++; }
      else if (h < a) { stats[t2].won++; stats[t1].lost++; }
      else { stats[t1].drawn++; stats[t2].drawn++; }
    }
  });

  const groups = groupOrder.map((g) => {
    const standing = groupTeams[g].map((name) => {
      const s = stats[name] || { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 };
      return { name, ...s, pts: s.won * 3 + s.drawn };
    });
    standing.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);

    return {
      group: g,
      teams: standing.map((t, i) => ({
        teamId: teamIdByName.get(t.name) ?? String(i + 1),
        played: t.played,
        won: t.won,
        drawn: t.drawn,
        lost: t.lost,
        goalsFor: t.gf,
        goalsAgainst: t.ga,
        goalDifference: t.gf - t.ga,
        points: t.pts,
        position: i + 1,
      })),
    };
  });

  const matches = rawMatches.map((m, i) => {
    const t1 = normalizeName(m.team1);
    const t2 = normalizeName(m.team2);
    const finished = !!m.score?.ft;
    return {
      id: String(i + 1),
      homeTeamId: teamIdByName.get(t1) ?? "",
      awayTeamId: teamIdByName.get(t2) ?? "",
      homeScore: finished ? m.score.ft[0] : null,
      awayScore: finished ? m.score.ft[1] : null,
      group: m.group ?? null,
      matchday: m.round ?? null,
      kickoff: parseOpenfootballKickoff(m.date, m.time),
      stadiumId: null,
      finished,
      status: finished ? "finished" : "notstarted",
      type: m.group ? "group" : "knockout",
    };
  });

  return {
    generatedAt,
    source: "openfootball",
    stale: false,
    teams,
    groups,
    matches,
    unmatchedTeams: [],
  };
}

// "Bosnia & Herzegovina" → "Bosnia and Herzegovina", trim whitespace
function normalizeName(name) {
  return (name ?? "").replace(/\s*&\s*/g, " and ").trim();
}

// "2026-06-11" + "13:00 UTC-6" → "2026-06-11T13:00:00-06:00"
function parseOpenfootballKickoff(date, time) {
  if (!date) return null;
  if (!time) return `${date}T00:00:00Z`;
  const m = time.match(/^(\d{2}:\d{2})\s+UTC([+-]\d+(?:\.\d+)?)$/);
  if (!m) return `${date}T00:00:00Z`;
  const offsetHours = parseFloat(m[2]);
  const sign = offsetHours <= 0 ? "-" : "+";
  const absH = Math.abs(Math.trunc(offsetHours)).toString().padStart(2, "0");
  const absM = Math.abs(Math.round((offsetHours % 1) * 60)).toString().padStart(2, "0");
  return `${date}T${m[1]}:00${sign}${absH}:${absM}`;
}

// ── worldcup26.ir normalizer (unchanged logic) ───────────────────────────────

export function normalizeApiSnapshot(raw) {
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

export function collectionFromResponse(value, key) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

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

// ── shared helpers ───────────────────────────────────────────────────────────

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

function numberValue(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseInt(value ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "" || value === "null") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringValue(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function nullableString(value) {
  if (value === null || value === undefined || value === "" || value === "null") return null;
  return String(value);
}

function normalizeKickoff(value) {
  if (!value) return null;
  const apiDateMatch = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!apiDateMatch) return String(value);
  const [, month, day, year, hour, minute] = apiDateMatch;
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
