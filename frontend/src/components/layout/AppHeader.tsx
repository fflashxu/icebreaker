import { Mail } from 'lucide-react';
import { useWizardStore } from '../../store/wizard';

export function AppHeader() {
  const reset = useWizardStore((s) => s.reset);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={reset}
          className="flex items-center gap-2 font-semibold text-gray-900 hover:text-sky-600 transition-colors"
        >
          <Mail className="w-5 h-5 text-sky-600" />
          <span>EmailGen</span>
        </button>
        <span className="text-xs text-gray-400">AI-powered recruitment outreach</span>
      </div>
    </header>
  );
}
