import { useEffect, useMemo, useState } from "react";
import { Activity, Clock, RadioTower } from "lucide-react";
import { Awards } from "./components/Awards";
import { GroupTables } from "./components/GroupTables";
import { Leaderboard } from "./components/Leaderboard";
import { MatchBoard } from "./components/MatchBoard";
import { Ticker } from "./components/Ticker";
import { loadDashboardData, type DashboardData } from "./lib/data";

const DATA_REFRESH_INTERVAL_MS = 60 * 1000;

interface AppProps {
  initialData?: DashboardData;
}

export default function App({ initialData }: AppProps) {
  const [data, setData] = useState<DashboardData | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      return;
    }

    let cancelled = false;

    async function refresh() {
      try {
        const nextData = await loadDashboardData();
        if (!cancelled) {
          setData(nextData);
          setError(null);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load dashboard data");
        }
      }
    }

    refresh();
    const interval = window.setInterval(refresh, DATA_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [initialData]);

  const topLine = useMemo(() => {
    if (!data) {
      return "Loading sweep board";
    }

    const refreshTime = formatClock(data.status.loadedAt);
    const generatedTime = formatClock(data.snapshot.generatedAt);
    return `Loaded ${refreshTime} | Snapshot ${generatedTime} | ${data.snapshot.source}`;
  }, [data]);

  if (!data) {
    return (
      <main className="dashboard loading">
        <section className="loadingPanel">
          <RadioTower aria-hidden="true" />
          <h1>ES WC Sweep</h1>
          <p>{error ?? "Loading live board"}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Office bragging rights only</p>
          <h1>ES WC Sweep</h1>
        </div>
        <div className="statusCluster">
          <span className={`statusPill ${data.status.stale ? "stale" : "live"}`}>
            <Activity size={16} aria-hidden="true" />
            {data.status.stale ? "Stale data" : "Live snapshot"}
          </span>
          <span className="statusPill">
            <Clock size={16} aria-hidden="true" />
            {topLine}
          </span>
        </div>
        <div className="brandBadge" aria-label="Cochlear branding">
          <img
            alt="Cochlear"
            src={`${import.meta.env.BASE_URL}brand/cochlear-logo-horizontal-charcoal.png`}
          />
        </div>
      </header>

      <section className="layout">
        <Leaderboard rows={data.leaderboard} />
        <MatchBoard snapshot={data.snapshot} />
        <aside className="sideStack">
          <GroupTables snapshot={data.snapshot} leaderboard={data.leaderboard} />
          <Awards awards={data.awards} leaderboard={data.leaderboard} />
        </aside>
      </section>

      <Ticker data={data} />
    </main>
  );
}

function formatClock(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
}
