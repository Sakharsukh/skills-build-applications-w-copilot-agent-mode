import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name?: string; mascot?: string; members?: unknown[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError(true));
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {error ? <p role="alert">Unable to load teams. Please try again.</p>
        : teams === null ? <p role="status">Loading teams...</p>
        : teams.length === 0 ? <p>No teams found.</p>
        : <ul>{teams.map((team, index) => <li key={index}>{team.name}{team.mascot ? ` - ${team.mascot}` : ''}{team.members ? ` (${team.members.length} members)` : ''}</li>)}</ul>}
    </CapabilityCard>
  );
}
