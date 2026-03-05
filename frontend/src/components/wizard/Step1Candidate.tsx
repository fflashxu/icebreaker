import { useState } from 'react';
import { ChevronRight, Upload, Type } from 'lucide-react';
import { useWizardStore } from '../../store/wizard';
import { FileDropzone } from '../candidate/FileDropzone';

export function Step1Candidate() {
  const [tab, setTab] = useState<'file' | 'text'>('file');
  const { candidateText, jobTitle, setCandidateText, setJobTitle, nextStep } = useWizardStore();

  const canContinue = candidateText.trim().length >= 10;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Candidate Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a resume or paste the candidate's background to personalize the email.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('file')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Upload File
        </button>
        <button
          onClick={() => setTab('text')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Type className="w-3.5 h-3.5" /> Paste Text
        </button>
      </div>

      <div className="card p-6 space-y-4">
        {tab === 'file' && (
          <div className="space-y-4">
            <FileDropzone onParsed={(text) => { setCandidateText(text); }} />
            {candidateText && (
              <div>
                <label className="label">Parsed Text (editable)</label>
                <textarea
                  value={candidateText}
                  onChange={(e) => setCandidateText(e.target.value)}
                  rows={8}
                  className="input resize-none text-xs font-mono"
                  placeholder="Parsed candidate text will appear here..."
                />
              </div>
            )}
          </div>
        )}

        {tab === 'text' && (
          <div>
            <label className="label">
              Candidate Background <span className="text-red-500">*</span>
            </label>
            <textarea
              value={candidateText}
              onChange={(e) => setCandidateText(e.target.value)}
              rows={12}
              className="input resize-none"
              placeholder="Paste the candidate's resume, LinkedIn profile, or any background information here...

Example:
- 5 years at Google as Senior SWE, led the Search Ads backend team
- Open source contributor: maintainer of react-query
- Talks at React Conf 2023 about streaming architecture
- MS CS from Stanford, focus on distributed systems"
            />
            <p className="text-xs text-gray-400 mt-1">{candidateText.length} / 4000 chars</p>
          </div>
        )}

        <div>
          <label className="label">Target Role (optional)</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="input"
            placeholder="e.g. Senior Software Engineer, Product Manager..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={nextStep}
          disabled={!canContinue}
          className="btn-primary"
        >
          Continue to Settings <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
