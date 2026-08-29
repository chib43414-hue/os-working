import React, { useState } from 'react';
import { CheckCircle2, Copy, FileText, Lock, Shuffle } from 'lucide-react';
import { DataTransformerResult } from '../../types';

interface DataTransformerViewProps {
  data: DataTransformerResult;
}

export const DataTransformerView: React.FC<DataTransformerViewProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.transformedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Transformation Pipeline Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/70 p-3.5 ring-1 ring-slate-800">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-indigo-500/20 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300">
            {data.inputFormat}
          </span>
          <Shuffle className="h-4 w-4 text-slate-500" />
          <span className="rounded-md bg-sky-500/20 px-2.5 py-1 font-mono text-xs font-bold text-sky-300">
            {data.outputFormat}
          </span>
          <span className="ml-2 text-xs text-slate-400">
            ({data.recordCount} records converted)
          </span>
        </div>
        {data.dataMaskingApplied && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <Lock className="h-3.5 w-3.5" /> PII Masking Applied
          </span>
        )}
      </div>

      {/* Output Content Window */}
      <div className="rounded-xl bg-slate-900/50 ring-1 ring-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Transformed Output Stream
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
          >
            <Copy className="h-3 w-3" /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-72 overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-slate-200">
          {data.transformedOutput}
        </pre>
      </div>

      {/* Inferred Schema Pill Grid */}
      {data.inferredSchema && Object.keys(data.inferredSchema).length > 0 && (
        <div className="rounded-xl bg-slate-900/40 p-3.5 ring-1 ring-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Inferred Schema & Types
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(data.inferredSchema).map(([field, type]) => (
              <div
                key={field}
                className="flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1 text-xs ring-1 ring-slate-800"
              >
                <span className="font-medium text-slate-200">{field}:</span>
                <span className="font-mono text-[11px] text-indigo-400">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
