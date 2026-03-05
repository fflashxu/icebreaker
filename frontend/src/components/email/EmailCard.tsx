import { useState } from 'react';
  import { Copy, Check, Loader2, Languages } from 'lucide-react';
import { GeneratedEmail } from '../../types';
import { generateAPI } from '../../api/client';
import { useWizardStore } from '../../store/wizard';

interface Props {
  email: GeneratedEmail;
  index: number;
  targetLanguage: string;
}

export function EmailCard({ email, index, targetLanguage }: Props) {
  const updateEmail = useWizardStore((s) => s.updateEmail);
  const [copied, setCopied] = useState<'subject' | 'all' | null>(null);
  const [translating, setTranslating] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);

  async function copy(type: 'subject' | 'all') {
    const text = type === 'subject' ? email.subject : `${email.subject}\n\n${email.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  async function translate() {
    setTranslating(true);
    setTransError(null);
    try {
      const result = await generateAPI.translate(email.subject, email.body, targetLanguage);
      updateEmail(email.id, result.subject, result.body);
    } catch (e: any) {
      setTransError(e.message);
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="card flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wide">
          Email {index + 1}
        </span>
        <div className="flex gap-1">
          <button
            onClick={translate}
            disabled={translating}
            title={`Translate to ${targetLanguage}`}
            className="btn-ghost py-1"
          >
            {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{targetLanguage}</span>
          </button>
          <button onClick={() => copy('all')} className="btn-ghost py-1">
            {copied === 'all' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Copy All</span>
          </button>
        </div>
      </div>

      {/* Subject */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</label>
          <button onClick={() => copy('subject')} className="btn-ghost py-0.5 text-xs">
            {copied === 'subject' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <input
          type="text"
          value={email.subject}
          onChange={(e) => updateEmail(email.id, e.target.value, email.body)}
          className="input font-medium"
        />
      </div>

      {/* Body */}
      <div className="px-5 pb-5 flex-1 flex flex-col">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Body</label>
        <textarea
          value={email.body}
          onChange={(e) => updateEmail(email.id, email.subject, e.target.value)}
          className="input resize-none flex-1 min-h-[220px] text-sm leading-relaxed"
        />
      </div>

      {transError && (
        <p className="px-5 pb-3 text-xs text-red-600">{transError}</p>
      )}
    </div>
  );
}
