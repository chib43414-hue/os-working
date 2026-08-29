import React from 'react';
import { Terminal, Shield, Code, Sparkles } from 'lucide-react';
import { AgentMetadata } from '../types';

interface ApiDocsViewProps {
  agents: AgentMetadata[];
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({ agents }) => {
  return (
    <div className="space-y-6 text-slate-200">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">SafeAgents REST API Endpoints</h2>
        <p className="mt-1 text-xs text-slate-400">
          The SafeAgents backend exposes standard REST endpoints for programmatic integration into CI/CD pipelines, observability monitors, and automated remediation systems.
        </p>
      </div>

      {/* Core Endpoints List */}
      <div className="space-y-4">
        {/* Universal Execute */}
        <div className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-600 px-2 py-0.5 font-mono text-xs font-bold text-white">
              POST
            </span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              /api/agents/:agentId/execute
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Executes the requested agent inside the sandbox with automated PII scrubbing, guardrail evaluation, and optional Gemini 3.7 Flash AI reasoning.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300 ring-1 ring-slate-800">
{`// Request Body:
{
  "payload": { ... },
  "dryRun": true,
  "useAi": true
}

// Response Schema:
{
  "success": true,
  "agentId": "log-analyzer",
  "executionTimeMs": 48,
  "safety": {
    "passed": true,
    "level": "VERIFIED_SAFE",
    "threatScore": 0,
    "piiDetected": true,
    "piiMaskedCount": 2
  },
  "data": { ... },
  "aiExplanation": "..."
}`}
          </pre>
        </div>

        {/* Safety Pre-flight Check */}
        <div className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-600 px-2 py-0.5 font-mono text-xs font-bold text-white">
              POST
            </span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              /api/agents/:agentId/safety-check
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Performs a fast pre-flight safety and threat score evaluation without executing downstream payloads.
          </p>
        </div>

        {/* Pipeline Chain */}
        <div className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-600 px-2 py-0.5 font-mono text-xs font-bold text-white">
              POST
            </span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              /api/pipeline/chain
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Executes a multi-agent sequential pipeline chain passing output data between agents.
          </p>
        </div>

        {/* Audit Logs */}
        <div className="rounded-xl bg-slate-900/70 p-4 ring-1 ring-slate-800">
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-600 px-2 py-0.5 font-mono text-xs font-bold text-white">
              GET
            </span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              /api/safety/audit-logs?limit=50
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Retrieves recent security audit records and threat evaluations.
          </p>
        </div>
      </div>
    </div>
  );
};
