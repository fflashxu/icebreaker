import { ChevronLeft, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../../store/wizard';
import { ProfileSelector } from '../profile/ProfileSelector';
import { STYLES, LANGUAGES } from '../../lib/styleConfig';
import { generateAPI, authAPI } from '../../api/client';
import { useQuery } from '@tanstack/react-query';

export function Step2Settings() {
  const navigate = useNavigate();
  const {
    selectedProfileId, selectedStyle, recommendedStyle, targetLanguage, emailCount,
    candidateText, jobTitle,
    setProfileId, setStyle, setLanguage, setEmailCount,
    isGenerating, generateError,
    setGenerating, setGenerateError, setEmails,
    prevStep, nextStep,
  } = useWizardStore();

  // Fetch fresh user data (bypasses stale localStorage cache)
  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => authAPI.me(),
    staleTime: 30_000,
  });
  const freeQuota = (me as any)?.freeQuota;

  const canGenerate = selectedProfileId && selectedStyle && targetLanguage;

  const { data: styleStats } = useQuery({
    queryKey: ['style-stats'],
    queryFn: generateAPI.getStyleStats,
    staleTime: 30_000,
  });

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateAPI.generate({
        candidateText,
        profileId: selectedProfileId,
        style: selectedStyle,
        targetLanguage,
        jobTitle: jobTitle || undefined,
        count: emailCount,
      });
      setEmails(result.emails);
      nextStep();
    } catch (e: any) {
      setGenerateError(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure the sender, style, and language for the generated emails.</p>
      </div>

      <div className="card p-6 space-y-5">
        {/* Profile */}
        <div>
          <label className="label">Sender Profile <span className="text-red-500">*</span></label>
          <ProfileSelector value={selectedProfileId} onChange={setProfileId} />
        </div>

        {/* Email Count */}
        <div>
          <label className="label">Number of Emails to Generate</label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEmailCount(n)}
                className={`w-16 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  emailCount === n
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="label">Email Style <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setStyle(style.id)}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selectedStyle === style.id
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-gray-200 hover:border-sky-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span className="font-medium text-sm text-gray-900">{style.name}</span>
                  </div>
                  {styleStats && (
                    <span className="text-xs text-gray-400">{(styleStats[style.id] ?? 0).toLocaleString()} generated</span>
                  )}
                </div>
                {recommendedStyle === style.id && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mb-1">
                    ✨ Recommended
                  </span>
                )}
                <p className="text-xs text-gray-400">{style.scenario}</p>
                <p className="text-xs text-gray-500 mt-1">{style.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="label">Target Language <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  targetLanguage === lang.code
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Free quota banner for new users */}
      {freeQuota !== undefined && freeQuota > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center justify-between">
          <span>🎉 <strong>{freeQuota > 900000 ? 'Unlimited' : freeQuota}</strong> free generation{freeQuota !== 1 ? 's' : ''} remaining — powered by system key</span>
          {freeQuota <= 20 && (
            <button onClick={() => navigate('/settings')} className="text-xs text-green-600 hover:text-green-800 underline flex items-center gap-0.5 shrink-0 ml-3">
              Add your key <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      {freeQuota !== undefined && freeQuota <= 5 && freeQuota > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          ⚠️ Almost out of free generations! <button onClick={() => navigate('/settings')} className="underline font-medium">Add your own API key</button> to keep generating.
        </div>
      )}

      {generateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {generateError}
          {generateError.includes('API Key') && (
            <div className="mt-1">
              <button onClick={() => navigate('/settings')} className="text-red-600 hover:text-red-800 underline text-xs font-medium">
                Go to Settings to add a key →
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={prevStep} className="btn-secondary">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating}
          className="btn-primary"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate Email{emailCount > 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
