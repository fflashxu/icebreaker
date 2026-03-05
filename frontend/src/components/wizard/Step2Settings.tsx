import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { useWizardStore } from '../../store/wizard';
import { ProfileSelector } from '../profile/ProfileSelector';
import { STYLES, LANGUAGES } from '../../lib/styleConfig';
import { generateAPI } from '../../api/client';

export function Step2Settings() {
  const {
    selectedProfileId, selectedStyle, targetLanguage, emailCount,
    candidateText, jobTitle,
    setProfileId, setStyle, setLanguage, setEmailCount,
    isGenerating, generateError,
    setGenerating, setGenerateError, setEmails,
    prevStep, nextStep,
  } = useWizardStore();

  const canGenerate = selectedProfileId && selectedStyle && targetLanguage;

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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{style.icon}</span>
                  <span className="font-medium text-sm text-gray-900">{style.name}</span>
                </div>
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

      {generateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {generateError}
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
