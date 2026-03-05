import { useState, useRef, DragEvent } from 'react';
import { Upload, Loader2, FileText, X } from 'lucide-react';
import { parseAPI } from '../../api/client';

interface Props {
  onParsed: (text: string) => void;
}

export function FileDropzone({ onParsed }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);
    try {
      const result = await parseAPI.uploadFile(file);
      onParsed(result.text);
    } catch (e: any) {
      setError(e.message || 'Failed to parse file');
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clear() {
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-sky-500 bg-sky-50'
            : 'border-gray-300 hover:border-sky-400 hover:bg-gray-50'
        } ${isLoading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={onInputChange}
        />

        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-sm text-gray-500">Parsing file...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-6 h-6 text-sky-500 shrink-0" />
            <span className="text-sm text-gray-700 font-medium truncate max-w-xs">{fileName}</span>
            <button
              onClick={(e) => { e.stopPropagation(); clear(); }}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Drop file here or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG, PNG — max 10MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <X className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}
