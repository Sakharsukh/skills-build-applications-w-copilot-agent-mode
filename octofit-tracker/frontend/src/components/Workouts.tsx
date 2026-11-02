import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Suggestion = { title?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError(true));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {error ? <p role="alert">Unable to load workout suggestions. Please try again.</p>
        : suggestions === null ? <p role="status">Loading workout suggestions...</p>
        : suggestions.length === 0 ? <p>No workout suggestions available.</p>
        : <ul>{suggestions.map((suggestion, index) => <li key={index}>{suggestion.title}{suggestion.reason ? ` - ${suggestion.reason}` : ''}</li>)}</ul>}
    </CapabilityCard>
  );
}
