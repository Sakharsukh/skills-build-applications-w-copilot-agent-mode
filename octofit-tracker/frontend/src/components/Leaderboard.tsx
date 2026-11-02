import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Ranking[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError(true));
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {error ? <p role="alert">Unable to load leaderboard. Please try again.</p>
        : leaderboard === null ? <p role="status">Loading leaderboard...</p>
        : leaderboard.length === 0 ? <p>No leaderboard rankings yet.</p>
        : <ol>{leaderboard.map((entry, index) => <li key={index}>{entry.teamName} - {entry.totalPoints} points</li>)}</ol>}
    </CapabilityCard>
  );
}
