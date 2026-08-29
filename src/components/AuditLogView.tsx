import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AuditLogEntry } from '../types';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/safety/audit-logs?limit=50');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Security & Governance Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Immutable log of all agent invocations, threat score evaluations, and guardrail decisions.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-slate-900/70 ring-1 ring-slate-800 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-3 py-2.5">Timestamp</th>
                <th className="px-3 py-2.5">Agent</th>
                <th className="px-3 py-2.5">Action</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Threat Score</th>
                <th className="px-3 py-2.5">Latency</th>
                <th className="px-3 py-2.5">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="px-3 py-2 font-semibold text-indigo-300">{log.agentId}</td>
                    <td className="px-3 py-2 text-slate-300">{log.action}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : log.status === 'BLOCKED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          log.threatScore > 50
                            ? 'text-rose-400'
                            : log.threatScore > 20
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {log.threatScore}/100
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">{log.executionTimeMs}ms</td>
                    <td className="px-3 py-2 text-slate-300 font-sans text-xs max-w-md truncate">
                      {log.summary}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No audit logs recorded yet. Execute any of the 10 agents to generate safety audit records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
