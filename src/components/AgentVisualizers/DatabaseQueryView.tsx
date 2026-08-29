import React from 'react';
import { CheckCircle2, Database, ShieldAlert, ShieldCheck } from 'lucide-react';
import { DatabaseQueryResult } from '../../types';

interface DatabaseQueryViewProps {
  data: DatabaseQueryResult;
}

export const DatabaseQueryView: React.FC<DatabaseQueryViewProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-slate-200">
      {/* Firewall Status Banner */}
      <div
        className={`flex items-center justify-between rounded-xl p-3.5 ring-1 ${
          data.isSafe
            ? 'bg-emerald-950/40 text-emerald-300 ring-emerald-500/30'
            : 'bg-rose-950/40 text-rose-300 ring-rose-500/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {data.isSafe ? (
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              SQL Injection Firewall: {data.isSafe ? 'VERIFIED SAFE' : 'BLOCKED INJECTION THREAT'}
            </div>
            <p className="text-[11px] opacity-85">
              Execution Time: {data.executionTimeMs}ms | Rows Returned: {data.rowsAffected} | Dry-Run: {String(data.dryRunMode)}
            </p>
          </div>
        </div>
      </div>

      {/* Threats Intercepted */}
      {data.injectionThreatsDetected.length > 0 && (
        <div className="space-y-1.5 rounded-xl bg-rose-950/30 p-3.5 ring-1 ring-rose-500/30">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Firewall Block Reason
          </div>
          {data.injectionThreatsDetected.map((threat, idx) => (
            <div key={idx} className="font-mono text-xs text-rose-200">
              • {threat}
            </div>
          ))}
        </div>
      )}

      {/* Result Grid Table */}
      {data.rows && data.rows.length > 0 && (
        <div className="overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800">
          <div className="border-b border-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Sandboxed Dataset Output ({data.rows.length} rows)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase text-slate-400">
                <tr>
                  {data.columns.map((col) => (
                    <th key={col} className="px-3 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {data.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    {data.columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-slate-200">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EXPLAIN QUERY PLAN breakdown */}
      <div className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Execution Plan (EXPLAIN QUERY PLAN)
        </div>
        <div className="mt-2 space-y-1.5 font-mono text-[11px]">
          {data.executionPlan.map((step) => (
            <div key={step.step} className="flex items-center justify-between rounded bg-slate-950/60 px-3 py-1.5">
              <span className="text-slate-300">
                Step {step.step}: {step.operation}
              </span>
              <span className="text-indigo-400">{step.estimatedCost}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
