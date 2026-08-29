import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Copy, TrendingUp, Undo2, Zap } from 'lucide-react';
import { SystemOptimizationResult } from '../../types';

interface SystemOptimizerViewProps {
  data: SystemOptimizationResult;
}

export const SystemOptimizerView: React.FC<SystemOptimizerViewProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'rollback'>('diff');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Benchmark Simulation KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Throughput Gain (RPS)</div>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold text-emerald-400">
            {data.simulatedBenchmark.afterRps}
            <span className="text-xs text-slate-500">from {data.simulatedBenchmark.beforeRps}</span>
          </div>
          <div className="mt-1 flex items-center text-[10px] text-emerald-400">
            <TrendingUp className="mr-1 h-3 w-3" /> +60.5% throughput
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Latency p99</div>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold text-indigo-400">
            {data.simulatedBenchmark.afterLatencyP99Ms}ms
            <span className="text-xs text-slate-500">from {data.simulatedBenchmark.beforeLatencyP99Ms}ms</span>
          </div>
          <div className="mt-1 text-[10px] text-indigo-400">-56.7% latency drop</div>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Memory Saved</div>
          <div className="mt-1 font-mono text-xl font-bold text-sky-400">
            {data.simulatedBenchmark.memorySavedMb} MB
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Heap GC optimization</div>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Efficiency Rating</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400">
            {data.currentScore} → {data.potentialScore}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">Risk: {data.riskRating}</div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-2 rounded-xl bg-slate-900/50 p-3.5 ring-1 ring-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Optimization Directives
        </div>
        <div className="space-y-2">
          {data.recommendations.map((rec) => (
            <div key={rec.id} className="rounded-lg bg-slate-950 p-3 text-xs ring-1 ring-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{rec.title}</span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                  {rec.risk}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-[11px] sm:grid-cols-2">
                <div className="rounded bg-rose-950/20 p-2 text-rose-300 border border-rose-900/30">
                  <div className="text-[10px] text-rose-400 uppercase font-semibold">Current:</div>
                  {rec.currentConfig}
                </div>
                <div className="rounded bg-emerald-950/20 p-2 text-emerald-300 border border-emerald-900/30">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold">Optimized:</div>
                  {rec.recommendedConfig}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{rec.estimatedImprovement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabbed Diff Patch & Rollback Script */}
      <div className="rounded-xl bg-slate-900/50 ring-1 ring-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('diff')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'diff' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unified Config Diff Patch
            </button>
            <button
              onClick={() => setActiveTab('rollback')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'rollback' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Automated Rollback Plan
            </button>
          </div>
          <button
            onClick={() => handleCopy(activeTab === 'diff' ? data.diffPatch : data.rollbackPlan)}
            className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
          >
            <Copy className="h-3 w-3" /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-64 overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-slate-200">
          {activeTab === 'diff' ? data.diffPatch : data.rollbackPlan}
        </pre>
      </div>
    </div>
  );
};
