import { useState } from 'react';
import { SenderProfile, ProfileRole } from '../../types';
import { ROLE_LABELS } from '../../lib/styleConfig';

interface Props {
  initial?: Partial<SenderProfile>;
  onSubmit: (data: Omit<SenderProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProfileForm({ initial, onSubmit, onCancel, loading }: Props) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    title: initial?.title || '',
    company: initial?.company || '',
    role: (initial?.role || 'HR') as ProfileRole,
    signature: initial?.signature || '',
    personalNote: initial?.personalNote || '',
  });
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit(form);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Your Name *</label>
          <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Alex Zhang" />
        </div>
        <div>
          <label className="label">Role Type *</label>
          <select className="select" value={form.role} onChange={(e) => set('role', e.target.value as ProfileRole)}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Title *</label>
        <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="Engineering Manager" />
      </div>

      <div>
        <label className="label">Company *</label>
        <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} required placeholder="Acme Corp" />
      </div>

      <div>
        <label className="label">Email Signature *</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.signature}
          onChange={(e) => set('signature', e.target.value)}
          required
          placeholder="Alex Zhang&#10;Engineering Manager | Acme Corp&#10;alex@acme.com | linkedin.com/in/alexzhang"
        />
      </div>

      <div>
        <label className="label">Personal Context (optional)</label>
        <textarea
          className="input resize-none"
          rows={2}
          value={form.personalNote}
          onChange={(e) => set('personalNote', e.target.value)}
          placeholder="e.g. I met this candidate at React Conf last year, or I personally use their open source library..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
      </div>
    </form>
  );
}
