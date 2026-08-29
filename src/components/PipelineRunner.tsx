import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { AgentId, AgentMetadata } from '../types';

interface PipelineRunnerProps {
  agents: AgentMetadata[];
}

export const PipelineRunner: React.FC<PipelineRunnerProps> = ({ agents }) => {
  const [pipelineSteps, setPipelineSteps] = useState<AgentId[]>([
    'log-analyzer',
    'code-assistant',
    'system-optimizer',
  ]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Array<{ stepIndex: number; agentId: AgentId; result: any }>>([]);

  const handleRunPipeline = async () => {
    setRunning(true);
    setResults([]);
    try {
      const response = await fetch('/api/pipeline/chain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: pipelineSteps.map((id) => ({
            agentId: id,
            dryRun: true,
            useAi: true,
          })),
        }),
      });
      const data = await response.json();
      if (data.pipelineResults) {
        setResults(data.pipelineResults);
      }
    } catch (e) {
      console.error('Pipeline error:', e);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 p-5 ring-1 ring-indigo-500/30 shadow-xl">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Multi-Agent Sequential Pipeline Chain
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-300">
          Chain multiple safe agents together into a unified remediation workflow. Outputs from each agent are passed safely into the downstream agent's context.
        </p>

        {/* Step Flow Preview */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {pipelineSteps.map((agentId, idx) => {
            const agentMeta = agents.find((a) => a.id === agentId);
            return (
              <React.Fragment key={idx}>
                <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 ring-1 ring-slate-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 font-mono text-[10px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-100">
                    {agentMeta?.name || agentId}
                  </span>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <button
          onClick={handleRunPipeline}
          disabled={running}
          className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 disabled:opacity-50"
        >
          {running ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Chaining Agents in Sandbox...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Execute Incident Remediation Chain</span>
            </>
          )}
        </button>
      </div>

      {/* Results Stream */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Pipeline Execution Steps ({results.length})
          </h3>
          <div className="space-y-3">
            {results.map((step) => {
              const agentMeta = agents.find((a) => a.id === step.agentId);
              return (
                <div
                  key={step.stepIndex}
                  className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-slate-800"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        ✓
                      </span>
                      <span className="font-bold text-white">
                        Step {step.stepIndex}: {agentMeta?.name}
                      </span>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                      {step.result.executionTimeMs}ms
                    </span>
                  </div>
                  {step.result.aiExplanation && (
                    <div className="mt-3 rounded-lg bg-slate-950 p-3 text-xs leading-relaxed text-slate-300 ring-1 ring-slate-850">
                      <span className="font-semibold text-purple-300">Agent Diagnosis: </span>
                      {step.result.aiExplanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
