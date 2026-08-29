import React from 'react';
import { AlertTriangle, CheckCircle2, FileCode, Hash, Key, Lock, ShieldCheck } from 'lucide-react';
import { FileAnalysisResult } from '../../types';

interface FileAnalyzerViewProps {
  data: FileAnalysisResult;
}

export const FileAnalyzerView: React.FC<FileAnalyzerViewProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-slate-200">
      {/* File Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-900/70 p-3.5 ring-1 ring-slate-800">
        <div className="flex items-center gap-2.5">
          <FileCode className="h-5 w-5 text-indigo-400" />
          <div>
            <div className="font-mono text-xs font-bold text-slate-100">{data.fileName}</div>
            <div className="text-[11px] text-slate-400">
              {data.fileSizeBytes} Bytes | MIME: {data.mimeType}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-bold ${
              data.isSafeForIngestion
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
            }`}
          >
            {data.isSafeForIngestion ? 'SAFE FOR INGESTION' : 'QUARANTINED / UNSAFE'}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Shannon Entropy */}
        <div className="rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">Shannon Entropy Score</span>
            <span className="font-mono font-bold text-slate-100">{data.entropyScore} / 8.0</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full transition-all ${
                data.entropyScore > 7.5 ? 'bg-rose-500' : data.entropyScore > 5.5 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(data.entropyScore / 8.0) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Classification:{' '}
            <span className="font-semibold text-slate-200">{data.entropyRating.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* SHA-256 Checksum */}
        <div className="rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Hash className="h-3.5 w-3.5 text-sky-400" /> SHA-256 Cryptographic Hash
          </div>
          <div className="mt-1.5 break-all rounded bg-slate-950 p-2 font-mono text-[10px] text-sky-300 ring-1 ring-slate-800">
            {data.sha256Hash}
          </div>
        </div>
      </div>

      {/* Sensitive Leaked Credentials List */}
      {data.sensitivePatternsFound.length > 0 ? (
        <div className="rounded-xl bg-rose-950/30 p-3.5 ring-1 ring-rose-500/30">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <Key className="h-4 w-4" /> Leaked Credentials Intercepted ({data.sensitivePatternsFound.length})
          </div>
          <div className="mt-2.5 space-y-2">
            {data.sensitivePatternsFound.map((secret, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-950/80 p-2.5 text-xs ring-1 ring-rose-500/20"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                    {secret.type}
                  </span>
                  {secret.line && <span className="font-mono text-slate-500">Line {secret.line}</span>}
                </div>
                <span className="font-mono text-[11px] text-slate-300">{secret.preview}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/20 p-3 text-xs text-emerald-300 ring-1 ring-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          No exposed API tokens, AWS keys, or private certificates detected in file.
        </div>
      )}
    </div>
  );
};
