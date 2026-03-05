import { useState } from 'react';
import { ChevronLeft, RefreshCw, Loader2, Languages } from 'lucide-react';
import { useWizardStore } from '../../store/wizard';
import { EmailCard } from '../email/EmailCard';
import { generateAPI } from '../../api/client';
import { LANGUAGES } from '../../lib/styleConfig';

export function Step3Results() {
  const {
    generatedEmails, targetLanguage, setLanguage, setEmails, updateEmail,
    candidateText, jobTitle, selectedProfileId, selectedStyle, emailCount,
    isGenerating, setGenerating, setGenerateError,
    prevStep,
  } = useWizardStore();

  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  async function regenerate() {
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
    } catch (e: any) {
      setGenerateError(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function translateAll(lang: string) {
    setLanguage(lang);
    setBulkTranslating(true);
    setBulkError(null);
    try {
      await Promise.all(
        generatedEmails.map(async (email) => {
          const result = await generateAPI.translate(email.subject, email.body, lang);
          updateEmail(email.id, result.subject, result.body);
        })
      );
    } catch (e: any) {
      setBulkError(e.message);
    } finally {
      setBulkTranslating(false);
    }
  }

  const colClass =
    generatedEmails.length === 1
      ? 'grid-cols-1 max-w-xl mx-auto'
      : generatedEmails.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Generated Emails</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {generatedEmails.length} email{generatedEmails.length !== 1 ? 's' : ''} — edit directly, then copy and send.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => prevStep()} className="btn-secondary">
            <ChevronLeft className="w-4 h-4" /> Modify Settings
          </button>
          <button onClick={regenerate} disabled={isGenerating} className="btn-secondary">
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate
          </button>
        </div>
      </div>

      {/* Bulk language switcher */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Languages className="w-4 h-4" />
          <span>Translate all:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => translateAll(lang.code)}
              disabled={bulkTranslating}
              className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                targetLanguage === lang.code
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-sky-400'
              } disabled:opacity-50`}
            >
              {bulkTranslating && targetLanguage === lang.code ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin inline" />
              ) : (
                lang.label
              )}
            </button>
          ))}
        </div>
      </div>

      {bulkError && (
        <p className="text-sm text-red-600">{bulkError}</p>
      )}

      {/* Email cards */}
      {generatedEmails.length > 0 ? (
        <div className={`grid gap-5 ${colClass}`}>
          {generatedEmails.map((email, i) => (
            <EmailCard key={email.id} email={email} index={i} targetLanguage={targetLanguage} />
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <p className="text-gray-400">No emails generated yet.</p>
        </div>
      )}
    </div>
  );
}
