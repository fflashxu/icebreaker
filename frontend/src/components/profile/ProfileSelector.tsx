import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { profilesAPI } from '../../api/client';
import { ProfileManager } from './ProfileManager';

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export function ProfileSelector({ value, onChange }: Props) {
  const [showManager, setShowManager] = useState(false);
  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.list,
  });

  return (
    <>
      <div className="flex gap-2">
        <select
          className="select flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Select a sender profile —</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.title} @ {p.company}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowManager(true)}
          className="btn-secondary px-3"
          title="Manage profiles"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {profiles.length === 0 && (
        <p className="text-xs text-amber-600 mt-1">
          No profiles found.{' '}
          <button
            onClick={() => setShowManager(true)}
            className="underline hover:no-underline"
          >
            Create one
          </button>{' '}
          to continue.
        </p>
      )}

      {showManager && (
        <ProfileManager
          onClose={() => setShowManager(false)}
          onSelect={(id) => { onChange(id); setShowManager(false); }}
        />
      )}
    </>
  );
}
