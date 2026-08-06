import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Copy, Plus, ArrowLeft, Check, Users, BarChart2, ExternalLink, ChevronDown, ChevronUp, Trash2, Zap, ArrowRightLeft } from 'lucide-react';
import { authAPI, adminAPI, keysAPI } from '../api/client';
import { useAuthStore } from '../store/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PROVIDER_GUIDES: Record<string, { name: string; step1: { text: string; link?: { label: string; href: string } }; steps: Array<{ text: string; link?: { label: string; href: string }; note?: string }> }> = {
  deepseek: {
    name: 'DeepSeek',
    step1: { text: '注册 DeepSeek 开放平台', link: { label: '前往注册', href: 'https://platform.deepseek.com/' } },
    steps: [
      { text: '进入 API Keys 页面', link: { label: '打开', href: 'https://platform.deepseek.com/api_keys' } },
      { text: '创建 Key，复制后保存', note: '新用户有免费额度' },
    ],
  },
  dashscope: {
    name: 'DashScope (阿里 Qwen)',
    step1: { text: '注册阿里云并开通 DashScope', link: { label: '前往开通', href: 'https://dashscope.console.aliyun.com/' } },
    steps: [
      { text: '进入 API-KEY 管理', link: { label: '打开', href: 'https://dashscope.console.aliyun.com/apiKey' } },
      { text: '创建 Key 并保存', note: '新用户有免费额度，OCR 需用 qwen-vl-plus' },
    ],
  },
  openai: {
    name: 'OpenAI',
    step1: { text: '注册 OpenAI 平台', link: { label: '前往注册', href: 'https://platform.openai.com/' } },
    steps: [
      { text: '进入 API Keys 页面', link: { label: '打开', href: 'https://platform.openai.com/api-keys' } },
      { text: '创建 Key 并保存', note: '需绑定支付方式' },
    ],
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    step1: { text: '注册月之暗面开放平台', link: { label: '前往注册', href: 'https://platform.moonshot.cn/' } },
    steps: [
      { text: '进入 API Keys 管理', link: { label: '打开', href: 'https://platform.moonshot.cn/console/api-keys' } },
      { text: '创建 Key 并保存' },
    ],
  },
  zhipu: {
    name: 'Zhipu (智谱 GLM)',
    step1: { text: '注册智谱 AI 开放平台', link: { label: '前往注册', href: 'https://open.bigmodel.cn/' } },
    steps: [
      { text: '进入 API Keys 页面', link: { label: '打开', href: 'https://open.bigmodel.cn/usercenter/apikeys' } },
      { text: '创建 Key 并保存' },
    ],
  },
  bytedance: {
    name: 'ByteDance (豆包)',
    step1: { text: '注册火山引擎 Ark 平台', link: { label: '前往注册', href: 'https://console.volcengine.com/ark/' } },
    steps: [
      { text: '创建推理接入点（Endpoint）', note: '需先创建 Endpoint 才能获取 API Key' },
      { text: '复制 Endpoint ID 作为 model 参数，Key 为火山引擎 API Key' },
    ],
  },
  gemini: {
    name: 'Google Gemini',
    step1: { text: '注册 Google AI Studio', link: { label: '前往注册', href: 'https://aistudio.google.com/' } },
    steps: [
      { text: '进入 API Keys 页面', link: { label: '打开', href: 'https://aistudio.google.com/apikey' } },
      { text: '创建 Key 并保存', note: '免费额度充足，但需科学上网' },
    ],
  },
  stepfun: {
    name: 'StepFun (阶跃星辰)',
    step1: { text: '注册阶跃星辰开放平台', link: { label: '前往注册', href: 'https://platform.stepfun.com/' } },
    steps: [
      { text: '进入 API Keys 管理', link: { label: '打开', href: 'https://platform.stepfun.com/console/api-keys' } },
      { text: '创建 Key 并保存' },
    ],
  },
  minimax: {
    name: 'MiniMax',
    step1: { text: '注册 MiniMax 开放平台', link: { label: '前往注册', href: 'https://platform.minimax.chat/' } },
    steps: [
      { text: '进入 API Keys 管理', link: { label: '打开', href: 'https://platform.minimax.chat/user-center/basic-information/interface-key' } },
      { text: '创建 Key 并保存' },
    ],
  },
};

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  // API Keys
  const [showAddKey, setShowAddKey] = useState(false);
  const [newProvider, setNewProvider] = useState('deepseek');
  const [newLabel, setNewLabel] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newModel, setNewModel] = useState('');
  const [addKeyError, setAddKeyError] = useState('');
  const [addingKey, setAddingKey] = useState(false);
  const [showGuideProvider, setShowGuideProvider] = useState<string | null>(null);

  // Legacy migration
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);

  // UI
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [newInviteCopied, setNewInviteCopied] = useState(false);

  const { data: keysData, isLoading: loadingKeys } = useQuery({
    queryKey: ['api-keys'], queryFn: keysAPI.list,
  });
  const { data: keyStats } = useQuery({
    queryKey: ['api-keys-stats'], queryFn: keysAPI.stats,
    enabled: user?.isAdmin === true,
  });
  const { data: invites, isLoading: loadingInvites } = useQuery({
    queryKey: ['invite-tokens'], queryFn: authAPI.listInviteTokens, enabled: user?.isAdmin === true,
  });
  const { data: adminStats, isLoading: loadingStats } = useQuery({
    queryKey: ['admin-stats'], queryFn: adminAPI.getStats, enabled: user?.isAdmin === true,
  });

  const createInviteMutation = useMutation({
    mutationFn: authAPI.createInviteToken,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['invite-tokens'] });
      const url = `${window.location.origin}/register?token=${data.token}`;
      setNewInviteUrl(url); setNewInviteCopied(true);
      navigator.clipboard.writeText(url);
      setTimeout(() => setNewInviteCopied(false), 2000);
    },
  });
  const deleteKeyMutation = useMutation({
    mutationFn: keysAPI.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
  });

  async function handleAddKey(e: FormEvent) {
    e.preventDefault(); setAddKeyError(''); setAddingKey(true);
    try {
      await keysAPI.add({ provider: newProvider, label: newLabel || PROVIDER_GUIDES[newProvider]?.name || newProvider, apiKey: newApiKey, model: newModel || undefined });
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewApiKey(''); setNewLabel(''); setNewModel(''); setShowAddKey(false);
    } catch (err: any) { setAddKeyError(err.message || 'Failed'); }
    finally { setAddingKey(false); }
  }

  async function handleMigrate() {
    setMigrating(true);
    try {
      const r = await keysAPI.migrateLegacy();
      if (r.migrated) { queryClient.invalidateQueries({ queryKey: ['api-keys'] }); setMigrated(true); }
    } catch {} finally { setMigrating(false); }
  }

  function copyInviteUrl(token: string) {
    navigator.clipboard.writeText(`${window.location.origin}/register?token=${token}`);
    setCopiedId(token); setTimeout(() => setCopiedId(null), 2000);
  }

  const providers = keysData?.providers || {};
  const keys = keysData?.keys || [];
  const hasLegacyKey = (user as any)?.dashscopeKey && !keys.some(k => k.provider === 'dashscope');
  const freeQuota = (user as any)?.freeQuota;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-sky-600" /><h2 className="text-base font-medium text-gray-900">API Keys</h2></div>
            <button onClick={() => { setShowAddKey(!showAddKey); setAddKeyError(''); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">
              <Plus className="w-3.5 h-3.5" />{showAddKey ? 'Cancel' : 'Add Key'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">Add keys from 9 supported providers. Email generation auto-uses your first active key. Supported: DeepSeek · DashScope · OpenAI · Moonshot · Zhipu · ByteDance · Gemini · StepFun · MiniMax.</p>

          {/* Free quota — shows which key powers it */}
          {freeQuota !== undefined && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
              🎉 <strong>{freeQuota > 900000 ? 'Unlimited' : freeQuota}</strong> free generations
              {keysData?.defaultKey ? <> — powered by <span className="font-medium">{keysData.defaultKey.label}</span> ({keysData.defaultKey.provider})</> : ' — no system default key set'}
              {freeQuota !== undefined && freeQuota <= 20 && freeQuota > 0 && ' — running out soon!'}
              {freeQuota !== undefined && freeQuota <= 0 && ' — quota exhausted. Add your own key below.'}
            </div>
          )}

          {/* Legacy migration */}
          {hasLegacyKey && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="text-sm text-amber-700"><ArrowRightLeft className="w-3.5 h-3.5 inline mr-1" />You have a legacy DashScope key. Migrate to the new system?</div>
              <button onClick={handleMigrate} disabled={migrating} className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50">
                {migrated ? 'Done ✓' : migrating ? 'Migrating…' : 'Migrate'}
              </button>
            </div>
          )}

          {/* Add key form */}
          {showAddKey && (
            <form onSubmit={handleAddKey} className="mb-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Provider</label>
                  <select value={newProvider} onChange={e => { setNewProvider(e.target.value); setNewModel(''); }} className="input mt-1 w-full text-sm">
                    {Object.entries(providers).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Model <span className="text-gray-400">(suggestions — or type any version)</span></label>
                  <input
                    list={`model-list-${newProvider}`}
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    className="input mt-1 w-full text-sm font-mono"
                    placeholder={providers[newProvider]?.models[0] || 'e.g. kimi-k3, qwen-3.8...'}
                  />
                  <datalist id={`model-list-${newProvider}`}>
                    {providers[newProvider]?.models.map((m: string) => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Label (optional)</label>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} className="input mt-1 w-full text-sm" placeholder={providers[newProvider]?.name || ''} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">API Key <span className="text-red-500">*</span></label>
                <input type="password" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} className="input mt-1 w-full font-mono text-xs" placeholder="sk-..." />
              </div>
              {addKeyError && <p className="text-sm text-red-600">{addKeyError}</p>}
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => setShowGuideProvider(showGuideProvider === newProvider ? null : newProvider)} className="text-xs text-sky-600 hover:text-sky-700">
                  How to get a {providers[newProvider]?.name} key?
                </button>
                <button type="submit" disabled={addingKey || !newApiKey} className="ml-auto px-4 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-50">
                  {addingKey ? 'Adding…' : 'Add Key'}
                </button>
              </div>

              {showGuideProvider && PROVIDER_GUIDES[showGuideProvider] && (
                <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 space-y-2">
                  <p className="text-xs font-semibold text-sky-800">{PROVIDER_GUIDES[showGuideProvider].name} 申请步骤</p>
                  <ol className="space-y-1.5">
                    {[{ text: PROVIDER_GUIDES[showGuideProvider].step1.text, link: PROVIDER_GUIDES[showGuideProvider].step1.link }, ...PROVIDER_GUIDES[showGuideProvider].steps].map((s, i) => (
                      <li key={i} className="flex gap-2 text-xs">
                        <span className="w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div><span className="text-gray-700">{s.text}</span>{s.link && <a href={s.link.href} target="_blank" rel="noopener noreferrer" className="ml-1 text-sky-600 hover:underline">{s.link.label} <ExternalLink className="w-2.5 h-2.5 inline" /></a>}{s.note && <p className="text-gray-400">{s.note}</p>}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </form>
          )}

          {/* Key list */}
          {loadingKeys ? <p className="text-sm text-gray-400">Loading…</p>
          : keys.length === 0 ? <p className="text-sm text-gray-400">No API keys yet. Add one to get started — or use free system quota.</p>
          : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className={`flex items-center justify-between p-3 rounded-lg border ${k.isDefault ? 'border-sky-300 bg-sky-50' : 'border-gray-100 bg-gray-50'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{k.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 uppercase">{k.provider}</span>
                      {k.model && <span className="text-[10px] text-gray-400">{k.model}</span>}
                      {k.isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500 text-white font-medium">System Default</span>}
                    </div>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">{k.apiKey}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {user?.isAdmin && !k.isDefault && (
                      <button
                        onClick={async () => { await keysAPI.setDefault(k.id); queryClient.invalidateQueries({ queryKey: ['api-keys'] }); }}
                        className="text-[10px] px-2 py-1 rounded bg-sky-100 text-sky-700 hover:bg-sky-200 font-medium"
                      >
                        Set Default
                      </button>
                    )}
                    <button onClick={() => deleteKeyMutation.mutate(k.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin: API Key Stats */}
        {user?.isAdmin && keyStats && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4"><Key className="w-4 h-4 text-sky-600" /><h2 className="text-base font-medium text-gray-900">API Key Usage</h2><span className="ml-auto text-xs text-gray-400">{keyStats.totalUsers} users with keys</span></div>
            {keyStats.stats.length > 0 ? (
              <div className="space-y-1.5">
                {keyStats.stats.map(s => (
                  <div key={s.provider} className="flex items-center gap-3 text-sm">
                    <span className="text-xs text-gray-500 w-36 shrink-0">{s.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-sky-400 h-2 rounded-full" style={{ width: `${(s.userCount / Math.max(...keyStats.stats.map(x => x.userCount), 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 w-6 text-right shrink-0">{s.userCount}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No API keys configured by any user yet.</p>}
          </div>
        )}

        {/* Admin: Invite Tokens */}
        {user?.isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-base font-medium text-gray-900">Invite Tokens</h2><p className="text-sm text-gray-500 mt-0.5">Generate invite links for new users</p></div>
              <button onClick={() => createInviteMutation.mutate()} disabled={createInviteMutation.isPending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 disabled:opacity-50"><Plus className="w-3.5 h-3.5" />{createInviteMutation.isPending ? 'Creating…' : 'New invite'}</button>
            </div>
            {newInviteUrl && (
              <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-200">
                <div className="flex items-center justify-between gap-2 mb-1.5"><span className="text-xs font-medium text-sky-700">New invite — ready to share</span>
                  <button onClick={() => { navigator.clipboard.writeText(newInviteUrl); setNewInviteCopied(true); setTimeout(() => setNewInviteCopied(false), 2000); }} className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700">{newInviteCopied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}</button>
                </div>
                <p className="text-xs font-mono text-sky-800 break-all">{newInviteUrl}</p>
              </div>
            )}
            {loadingInvites ? <p className="text-sm text-gray-400">Loading…</p> : invites && invites.length > 0 ? (
              <div className="space-y-2">
                {invites.map((invite: any) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <div className="min-w-0"><p className="text-xs font-mono text-gray-600 truncate">{invite.token}</p>
                      <div className="flex items-center gap-2 mt-0.5">{invite.usedAt ? <span className="text-xs text-gray-400">Used {new Date(invite.usedAt).toLocaleDateString()}</span> : new Date(invite.expiresAt) < new Date() ? <span className="text-xs text-red-500">Expired</span> : <span className="text-xs text-green-600">Valid · expires {new Date(invite.expiresAt).toLocaleDateString()}</span>}</div>
                    </div>
                    {!invite.usedAt && new Date(invite.expiresAt) >= new Date() && (
                      <button onClick={() => copyInviteUrl(invite.token)} className="ml-3 flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700">{copiedId === invite.token ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy link</>}</button>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No invite tokens yet.</p>}
          </div>
        )}

        {/* Admin: User Stats */}
        {user?.isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-sky-600" /><h2 className="text-base font-medium text-gray-900">User Generation Stats</h2>{adminStats && <span className="ml-auto text-xs text-gray-400">{adminStats.totalUsers} users · {adminStats.totalGenerations} total emails</span>}</div>
            {loadingStats ? <p className="text-sm text-gray-400">Loading…</p> : adminStats && adminStats.users.length > 0 ? (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-400 border-b"><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Joined</th><th className="pb-2 text-right">Emails</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{adminStats.users.map((u: any) => (<tr key={u.id} className="text-gray-700"><td className="py-2 pr-4 font-medium">{u.name}</td><td className="py-2 pr-4 text-gray-500 text-xs">{u.email}</td><td className="py-2 pr-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td><td className="py-2 text-right"><span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold">{u.generationCount}</span></td></tr>))}</tbody></table></div>
            ) : <p className="text-sm text-gray-400">No data yet.</p>}
          </div>
        )}

        {/* Admin: Growth Chart */}
        {user?.isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-sky-600" /><h2 className="text-base font-medium text-gray-900">User Growth (Last 30 Days)</h2></div>
            {loadingStats ? <p className="text-sm text-gray-400">Loading…</p> : adminStats && adminStats.dailyRegistrations.length > 0 ? (
              <div className="space-y-1.5">{(() => { const max = Math.max(...adminStats.dailyRegistrations.map((d: any) => d.count), 1); return adminStats.dailyRegistrations.map((d: any) => (<div key={d.date} className="flex items-center gap-3 text-sm"><span className="text-xs text-gray-400 w-24 shrink-0">{d.date}</span><div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden"><div className="bg-sky-400 h-2 rounded-full" style={{ width: `${(d.count / max) * 100}%` }} /></div><span className="text-xs text-gray-600 w-6 text-right shrink-0">{d.count}</span></div>)); })()}</div>
            ) : <p className="text-sm text-gray-400">No registrations.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
