import React from 'react';
import { AlertCircle, AlertOctagon, CheckCircle, FileText, Lock, ShieldAlert } from 'lucide-react';
import { LogAnalysisResult } from '../../types';

interface LogAnalyzerViewProps {
  data: LogAnalysisResult;
}

export const LogAnalyzerView: React.FC<LogAnalyzerViewProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-slate-200">
      {/* Metrics Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Total Logs Parsed</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">{data.totalLogsParsed}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-rose-400">Errors Flagged</div>
          <div className="mt-1 font-mono text-xl font-bold text-rose-400">{data.errorCount}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-amber-400">Warnings</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-400">{data.warningCount}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-emerald-400">PII Tokens Scrubbed</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400">{data.sanitizedPiiCount}</div>
        </div>
      </div>

      {/* Security Threats Detected */}
      {data.securityThreatsFound.length > 0 ? (
        <div className="rounded-xl bg-rose-950/30 p-4 ring-1 ring-rose-500/30">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="h-4 w-4" />
            Security Attack Vectors Intercepted ({data.securityThreatsFound.length})
          </div>
          <div className="mt-3 space-y-2">
            {data.securityThreatsFound.map((threat, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-slate-950/70 p-3 text-xs ring-1 ring-rose-500/20"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                    {threat.category} - {threat.severity}
                  </span>
                </div>
                <div className="mt-1.5 font-mono text-[11px] text-rose-200/90 break-all bg-slate-900/80 p-2 rounded border border-rose-900/30">
                  {threat.rawSnippet}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-300">{threat.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-950/20 p-3.5 text-xs text-emerald-300 ring-1 ring-emerald-500/20">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          No external intrusion or SQLi/XSS signatures detected in log sample.
        </div>
      )}

      {/* Scrubbed Log Sample */}
      <div className="rounded-xl bg-slate-900/50 p-3.5 ring-1 ring-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sanitized Log Stream Preview (PII-Masked)
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Lock className="h-3 w-3" /> Zero-PII Ingestion Mode
          </span>
        </div>
        <pre className="mt-2 max-h-52 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300 ring-1 ring-slate-800">
          {data.scrubbedLogSample}
        </pre>
      </div>
    </div>
  );
};
