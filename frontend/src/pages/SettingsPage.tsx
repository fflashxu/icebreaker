import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Copy, Plus, ArrowLeft, Check, Users, BarChart2 } from 'lucide-react';
import { authAPI, adminAPI } from '../api/client';
import { useAuthStore } from '../store/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const [keyValue, setKeyValue] = useState(user?.dashscopeKey || '');
  const [keyError, setKeyError] = useState('');
  const [keySuccess, setKeySuccess] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [newInviteCopied, setNewInviteCopied] = useState(false);

  const { data: invites, isLoading: loadingInvites } = useQuery({
    queryKey: ['invite-tokens'],
    queryFn: authAPI.listInviteTokens,
    enabled: user?.isAdmin === true,
  });

  const { data: adminStats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminAPI.getStats,
    enabled: user?.isAdmin === true,
  });

  const createInviteMutation = useMutation({
    mutationFn: authAPI.createInviteToken,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['invite-tokens'] });
      const url = `${window.location.origin}/register?token=${data.token}`;
      setNewInviteUrl(url);
      setNewInviteCopied(true);
      navigator.clipboard.writeText(url);
      setTimeout(() => setNewInviteCopied(false), 2000);
    },
  });

  async function handleSaveKey(e: FormEvent) {
    e.preventDefault();
    setKeyError('');
    setKeySuccess(false);
    setSavingKey(true);
    try {
      const updated = await authAPI.updateDashscopeKey(keyValue);
      updateUser(updated);
      setKeySuccess(true);
      setTimeout(() => setKeySuccess(false), 3000);
    } catch (err: any) {
      setKeyError(err.message || 'Failed to save key');
    } finally {
      setSavingKey(false);
    }
  }

  function copyInviteUrl(token: string) {
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>

        {/* DashScope Key */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-sky-600" />
            <h2 className="text-base font-medium text-gray-900">DashScope API Key</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Required to generate emails. Get your key at{' '}
            <span className="text-sky-600">dashscope.aliyuncs.com</span>.
          </p>

          {keyError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {keyError}
            </div>
          )}

          {keySuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Key saved successfully
            </div>
          )}

          <form onSubmit={handleSaveKey} className="flex gap-2">
            <input
              type="password"
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxx"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent font-mono"
            />
            <button
              type="submit"
              disabled={savingKey || !keyValue}
              className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
            >
              {savingKey ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>

        {/* Admin: Invite Tokens */}
        {user?.isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-medium text-gray-900">Invite Tokens</h2>
                <p className="text-sm text-gray-500 mt-0.5">Generate invite links for new users</p>
              </div>
              <button
                onClick={() => createInviteMutation.mutate()}
                disabled={createInviteMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {createInviteMutation.isPending ? 'Creating…' : 'New invite'}
              </button>
            </div>

            {newInviteUrl && (
              <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-medium text-sky-700">New invite link — ready to share</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newInviteUrl);
                      setNewInviteCopied(true);
                      setTimeout(() => setNewInviteCopied(false), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 shrink-0"
                  >
                    {newInviteCopied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <p className="text-xs font-mono text-sky-800 break-all">{newInviteUrl}</p>
              </div>
            )}

            {loadingInvites ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : invites && invites.length > 0 ? (
              <div className="space-y-2">
                {invites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-600 truncate">{invite.token}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {invite.usedAt ? (
                          <span className="text-xs text-gray-400">
                            Used {new Date(invite.usedAt).toLocaleDateString()}
                          </span>
                        ) : new Date(invite.expiresAt) < new Date() ? (
                          <span className="text-xs text-red-500">Expired</span>
                        ) : (
                          <span className="text-xs text-green-600">
                            Valid · expires {new Date(invite.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {!invite.usedAt && new Date(invite.expiresAt) >= new Date() && (
                      <button
                        onClick={() => copyInviteUrl(invite.token)}
                        className="ml-3 flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 shrink-0"
                      >
                        {copiedId === invite.token ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy link
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No invite tokens yet.</p>
            )}
          </div>
        )}

        {/* Admin: User Generation Stats */}
        {user?.isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-medium text-gray-900">User Generation Stats</h2>
              {adminStats && (
                <span className="ml-auto text-xs text-gray-400">
                  {adminStats.totalUsers} users · {adminStats.totalGenerations} total emails
                </span>
              )}
            </div>
            {loadingStats ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : adminStats && adminStats.users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 font-medium">Name</th>
                      <th className="pb-2 font-medium">Email</th>
                      <th className="pb-2 font-medium">Joined</th>
                      <th className="pb-2 font-medium text-right">Emails generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adminStats.users.map((u) => (
                      <tr key={u.id} className="text-gray-700">
                        <td className="py-2 pr-4 font-medium">{u.name}</td>
                        <td className="py-2 pr-4 text-gray-500 text-xs">{u.email}</td>
                        <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">
                            {u.generationCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No data yet.</p>
            )}
          </div>
        )}

        {/* Admin: Daily Registration Trend */}
        {user?.isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-sky-600" />
              <h2 className="text-base font-medium text-gray-900">User Growth (Last 30 Days)</h2>
            </div>
            {loadingStats ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : adminStats && adminStats.dailyRegistrations.length > 0 ? (
              <div className="space-y-1.5">
                {(() => {
                  const max = Math.max(...adminStats.dailyRegistrations.map((d) => d.count), 1);
                  return adminStats.dailyRegistrations.map((d) => (
                    <div key={d.date} className="flex items-center gap-3 text-sm">
                      <span className="text-xs text-gray-400 w-24 shrink-0">{d.date}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-400 h-2 rounded-full transition-all"
                          style={{ width: `${(d.count / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-6 text-right shrink-0">{d.count}</span>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No registrations in the last 30 days.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
