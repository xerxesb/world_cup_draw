import type { DashboardData } from "../lib/data";

interface TickerProps {
  data: DashboardData;
}

export function Ticker({ data }: TickerProps) {
  const top = data.leaderboard[0];
  const bonusCount = data.allocations.reduce((count, allocation) => count + allocation.bonus.length, 0);

  return (
    <footer className="ticker">
      <span>The tiers were frozen before the draw.</span>
      <span>The script only randomised allocation.</span>
      <span>{bonusCount} bonus teams are in play.</span>
      <span>{top ? `${top.participant} leads on ${top.totalPoints} points.` : "Leaderboard warming up."}</span>
      <span>Himanshu is included by democratic exception.</span>
    </footer>
  );
}
