import React from 'react';
import { AlertTriangle, CheckCircle2, Regex, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { RegexTestResult } from '../../types';

interface RegexTesterViewProps {
  data: RegexTestResult;
}

export const RegexTesterView: React.FC<RegexTesterViewProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-slate-200">
      {/* ReDoS Shield Banner */}
      <div
        className={`flex items-center justify-between rounded-xl p-3.5 ring-1 ${
          data.redosAnalysis.vulnerabilityLevel === 'HIGH_RISK_CATASTROPHIC'
            ? 'bg-rose-950/40 text-rose-300 ring-rose-500/30'
            : data.redosAnalysis.vulnerabilityLevel === 'LOW_RISK'
            ? 'bg-amber-950/40 text-amber-300 ring-amber-500/30'
            : 'bg-emerald-950/40 text-emerald-300 ring-emerald-500/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {data.redosAnalysis.vulnerabilityLevel === 'HIGH_RISK_CATASTROPHIC' ? (
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              ReDoS Defense Status: {data.redosAnalysis.vulnerabilityLevel.replace(/_/g, ' ')}
            </div>
            <p className="text-[11px] opacity-85">
              Engine Step Bound: {data.redosAnalysis.stepCount} steps | Valid Syntax: {String(data.isValid)}
            </p>
          </div>
        </div>
      </div>

      {/* Matches Found */}
      <div className="rounded-xl bg-slate-900/50 p-3.5 ring-1 ring-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Matched Substrings ({data.matches.length})
        </div>
        {data.matches.length > 0 ? (
          <div className="mt-2 space-y-2">
            {data.matches.map((match, idx) => (
              <div key={idx} className="rounded-lg bg-slate-950 p-2.5 text-xs ring-1 ring-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-300">"{match.matchedText}"</span>
                  <span className="font-mono text-[10px] text-slate-500">Index {match.index}</span>
                </div>
                {match.captureGroups.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {match.captureGroups.map((group, gIdx) => (
                      <span
                        key={gIdx}
                        className="rounded bg-indigo-950/60 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300 ring-1 ring-indigo-500/20"
                      >
                        Group ${gIdx + 1}: {group}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-400 italic">No matches found in provided test input.</div>
        )}
      </div>

      {/* Synthetic Unit Tests Matrix */}
      {data.syntheticTestCases.length > 0 && (
        <div className="rounded-xl bg-slate-900/40 p-3.5 ring-1 ring-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Synthetic Regex Verification Vectors
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.syntheticTestCases.map((tc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-950/80 p-2.5 text-xs ring-1 ring-slate-800"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate font-mono text-slate-200">{tc.input}</div>
                  <div className="text-[10px] text-slate-400">{tc.description}</div>
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    tc.expectedMatch
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tc.expectedMatch ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {tc.expectedMatch ? 'MATCH' : 'REJECT'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
