import React from 'react';
import { AlertTriangle, CheckCircle2, Cpu, Shield, ShieldAlert, Zap } from 'lucide-react';
import { ProcessManagerResult } from '../../types';

interface ProcessManagerViewProps {
  data: ProcessManagerResult;
}

export const ProcessManagerView: React.FC<ProcessManagerViewProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-slate-200">
      {/* Action Taken Banner */}
      {data.actionTaken && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3.5 ring-1 ${
            data.actionTaken.result === 'DENIED_PROTECTED_PROCESS'
              ? 'bg-rose-950/40 text-rose-300 ring-rose-500/30'
              : 'bg-indigo-950/40 text-indigo-300 ring-indigo-500/30'
          }`}
        >
          {data.actionTaken.result === 'DENIED_PROTECTED_PROCESS' ? (
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
          )}
          <div className="text-xs">
            <div className="font-bold uppercase tracking-wider">
              Safety Signal Action: {data.actionTaken.result.replace(/_/g, ' ')}
            </div>
            <p className="mt-0.5 text-slate-300">{data.actionTaken.message}</p>
          </div>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Total Monitored</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">{data.totalProcesses}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-rose-400">High Threat Score</div>
          <div className="mt-1 font-mono text-xl font-bold text-rose-400">{data.highRiskCount}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-amber-400">Zombie Defunct</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-400">{data.zombieCount}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-sky-400">Resource Hogs</div>
          <div className="mt-1 font-mono text-xl font-bold text-sky-400">{data.resourceHogCount}</div>
        </div>
      </div>

      {/* Process Table */}
      <div className="overflow-hidden rounded-xl bg-slate-900/50 ring-1 ring-slate-800">
        <div className="border-b border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          Process Tree & Governance Ratings
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase text-slate-400">
              <tr>
                <th className="px-3 py-2">PID</th>
                <th className="px-3 py-2">Process Name</th>
                <th className="px-3 py-2">CPU</th>
                <th className="px-3 py-2">RAM</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Safety Shield</th>
                <th className="px-3 py-2">Threat Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.processes.map((proc) => (
                <tr key={proc.pid} className="hover:bg-slate-800/30">
                  <td className="px-3 py-2.5 font-mono text-slate-400">{proc.pid}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-100">
                    <div>{proc.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">{proc.command}</div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{proc.cpuUsage}%</td>
                  <td className="px-3 py-2.5 font-mono text-slate-300">{proc.memoryUsageMb} MB</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        proc.status === 'RUNNING'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : proc.status === 'ZOMBIE'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {proc.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {proc.isProtected ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400">
                        <Shield className="h-3 w-3" /> Shielded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Unshielded</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`font-mono text-xs font-bold ${
                        proc.threatRiskScore > 50
                          ? 'text-rose-400'
                          : proc.threatRiskScore > 20
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {proc.threatRiskScore}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
