import { useState, useRef } from 'react';
import { ChevronRight, Upload, Type, FileSpreadsheet, Globe } from 'lucide-react';
import { useWizardStore } from '../../store/wizard';
import { FileDropzone } from '../candidate/FileDropzone';
import { parseAPI } from '../../api/client';
import { recommendStyle } from '../../lib/styleConfig';

type InputTab = 'file' | 'text' | 'csv' | 'url';

export function Step1Candidate() {
  const [tab, setTab] = useState<InputTab>('file');
  const { candidateText, jobTitle, setCandidateText, setJobTitle, setRecommendedStyle, nextStep } = useWizardStore();

  // CSV state
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState('');
  const [csvCandidates, setCsvCandidates] = useState<Array<{ name?: string; email?: string; rawText: string; source: string }>>([]);
  const [selectedCsvIdx, setSelectedCsvIdx] = useState(0);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // URL state
  const [urlText, setUrlText] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlResults, setUrlResults] = useState<{ ok: number; fail: number } | null>(null);

  const canContinue = candidateText.trim().length >= 10;

  function handleContinue() {
    const rec = recommendStyle(candidateText, jobTitle);
    setRecommendedStyle(rec);
    nextStep();
  }

  // ── CSV handling ──
  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    setCsvError('');
    try {
      const res = await parseAPI.uploadCsv(file);
      setCsvCandidates(res.candidates);
      if (res.candidates.length > 0) {
        setSelectedCsvIdx(0);
        setCandidateText(res.candidates[0].rawText);
        if (res.candidates[0].name) setJobTitle(res.candidates[0].name);
      }
    } catch (err: any) {
      setCsvError(err.response?.data?.error || err.message || 'CSV parse failed');
    } finally {
      setCsvLoading(false);
      e.target.value = '';
    }
  }

  function selectCsvCandidate(idx: number) {
    setSelectedCsvIdx(idx);
    setCandidateText(csvCandidates[idx].rawText);
    if (csvCandidates[idx].name) setJobTitle(csvCandidates[idx].name);
  }

  // ── URL handling ──
  async function handleUrls() {
    const urls = urlText.split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
    if (!urls.length) return;
    setUrlLoading(true);
    setUrlError('');
    setUrlResults(null);
    try {
      const res = await parseAPI.parseUrls(urls);
      const successful = res.candidates.filter(r => r.ok).map(r => r.candidate!);
      const failCount = res.candidates.filter(r => !r.ok).length;
      setUrlResults({ ok: successful.length, fail: failCount });
      if (successful.length > 0) {
        setCandidateText(successful[0].rawText);
        if (successful[0].name) setJobTitle(successful[0].name);
      }
      if (successful.length === 0 && failCount > 0) {
        setUrlError('All URLs failed to parse. Check the URLs and try again.');
      }
    } catch (err: any) {
      setUrlError(err.response?.data?.error || err.message || 'URL import failed');
    } finally {
      setUrlLoading(false);
    }
  }

  const SUPPORTED_EXTS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Candidate Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload a resume, CSV, paste text, or fetch a personal website.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {([
          ['file', Upload, 'Upload File'],
          ['text', Type, 'Paste Text'],
          ['csv', FileSpreadsheet, 'CSV/Excel'],
          ['url', Globe, 'URL'],
        ] as const).map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setUrlResults(null); setUrlError(''); setCsvError(''); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="card p-6 space-y-4">
        {/* Upload File tab */}
        {tab === 'file' && (
          <div className="space-y-4">
            <FileDropzone
              onParsed={(text) => setCandidateText(text)}
              onClear={() => setCandidateText('')}
            />
            <div>
              <label className="label">Parsed Text (editable)</label>
              <textarea
                value={candidateText}
                onChange={(e) => setCandidateText(e.target.value)}
                rows={8}
                className="input resize-none text-xs font-mono"
                placeholder="Parsed candidate text will appear here..."
              />
              {candidateText.length > 0 && candidateText.trim().length < 10 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Text too short ({candidateText.trim().length} chars, min 10).
                </p>
              )}
            </div>
          </div>
        )}

        {/* Paste Text tab */}
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
              placeholder="Paste the candidate's resume, LinkedIn profile, or any background information here..."
            />
            <p className="text-xs text-gray-400 mt-1">{candidateText.length} / 10000 chars</p>
          </div>
        )}

        {/* CSV / Excel tab */}
        {tab === 'csv' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Upload a CSV or Excel file. Must include columns: name, email, background.
            </p>
            <div className="flex items-center gap-3">
              <button
                className="btn-secondary"
                onClick={() => csvInputRef.current?.click()}
                disabled={csvLoading}
              >
                {csvLoading ? 'Parsing...' : 'Choose File'}
              </button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleCsvFile}
              />
              {csvCandidates.length > 0 && (
                <span className="text-sm text-green-600">
                  {csvCandidates.length} candidate(s) loaded
                </span>
              )}
            </div>
            {csvError && <p className="text-sm text-red-600">{csvError}</p>}

            {csvCandidates.length > 0 && (
              <>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {csvCandidates.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => selectCsvCandidate(i)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        i === selectedCsvIdx ? 'bg-sky-50 border-l-2 border-sky-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-medium">{c.name || `Candidate ${i + 1}`}</span>
                      {c.email && <span className="text-gray-400 ml-2">{c.email}</span>}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Selected Candidate Text (editable)</label>
                  <textarea
                    value={candidateText}
                    onChange={(e) => setCandidateText(e.target.value)}
                    rows={8}
                    className="input resize-none text-xs font-mono"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* URL tab */}
        {tab === 'url' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Paste one URL per line — personal sites, LinkedIn, Google Scholar, company bios, etc.
            </p>
            <textarea
              className="input h-28 resize-none font-mono text-xs"
              placeholder="https://sites.google.com/view/example/
https://github.com/janedoe"
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button
                className="btn-primary"
                onClick={handleUrls}
                disabled={urlLoading || !urlText.trim()}
              >
                {urlLoading ? 'Importing...' : 'Import URLs'}
              </button>
              {urlResults && (
                <span className={`text-sm font-medium ${urlResults.fail > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {urlResults.ok} imported{urlResults.fail > 0 ? `, ${urlResults.fail} failed` : ''}
                </span>
              )}
            </div>
            {urlError && <p className="text-sm text-red-600">{urlError}</p>}

            <div>
              <label className="label">Parsed Candidate Text (editable)</label>
              <textarea
                value={candidateText}
                onChange={(e) => setCandidateText(e.target.value)}
                rows={8}
                className="input resize-none text-xs font-mono"
                placeholder="Parsed content will appear here..."
              />
            </div>
          </div>
        )}

        {/* Target Role — shared across all tabs */}
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
          onClick={handleContinue}
          disabled={!canContinue}
          className="btn-primary"
        >
          Continue to Settings <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
