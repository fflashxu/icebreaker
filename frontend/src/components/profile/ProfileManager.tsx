import { useState } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesAPI } from '../../api/client';
import { SenderProfile } from '../../types';
import { ProfileForm } from './ProfileForm';
import { ROLE_LABELS } from '../../lib/styleConfig';

interface Props {
  onClose: () => void;
  onSelect?: (id: string) => void;
}

export function ProfileManager({ onClose, onSelect }: Props) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<SenderProfile | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: profilesAPI.list,
  });

  const createMutation = useMutation({
    mutationFn: profilesAPI.create,
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      setCreating(false);
      onSelect?.(p.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => profilesAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: profilesAPI.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Sender Profiles</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {(creating || editing) ? (
            <div className="card p-5">
              <h3 className="font-medium text-gray-900 mb-4">
                {editing ? 'Edit Profile' : 'New Profile'}
              </h3>
              <ProfileForm
                initial={editing || undefined}
                loading={createMutation.isPending || updateMutation.isPending}
                onSubmit={async (data) => {
                  if (editing) {
                    await updateMutation.mutateAsync({ id: editing.id, data });
                  } else {
                    await createMutation.mutateAsync(data as any);
                  }
                }}
                onCancel={() => { setCreating(false); setEditing(null); }}
              />
            </div>
          ) : (
            <>
              <button
                onClick={() => setCreating(true)}
                className="w-full btn-secondary justify-center"
              >
                <Plus className="w-4 h-4" /> New Profile
              </button>

              {profiles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No profiles yet. Create one to get started.
                </p>
              ) : (
                profiles.map((p) => (
                  <div key={p.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => { onSelect?.(p.id); onClose(); }}
                          className="text-left w-full"
                        >
                          <p className="font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-sm text-gray-500 truncate">{p.title} · {p.company}</p>
                          <span className="inline-block mt-1 text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                            {ROLE_LABELS[p.role]}
                          </span>
                        </button>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditing(p)}
                          className="btn-ghost p-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(p.id)}
                          className="btn-ghost p-1.5 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
