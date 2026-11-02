import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError(true));
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {error ? (
        <p role="alert">Unable to load activities. Please try again.</p>
      ) : activities === null ? (
        <p role="status">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p>No activities recorded.</p>
      ) : (
        <ul>
          {activities.map((activity, index) => (
            <li key={index}>{activity.type} - {activity.minutes} minutes - {activity.points} points</li>
          ))}
        </ul>
      )}
    </CapabilityCard>
  );
}
