import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Copy,
  FileCode,
  Lock,
  Play,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  AgentExecutionResponse,
  AgentId,
  AgentMetadata,
  CodeAnalysisResult,
  ContentAnalysisResult,
  DatabaseQueryResult,
  DataTransformerResult,
  FileAnalysisResult,
  LogAnalysisResult,
  ProcessManagerResult,
  RegexTestResult,
  SystemMetrics,
  SystemOptimizationResult,
} from '../types';
import { CodeAssistantView } from './AgentVisualizers/CodeAssistantView';
import { ContentAnalyzerView } from './AgentVisualizers/ContentAnalyzerView';
import { DatabaseQueryView } from './AgentVisualizers/DatabaseQueryView';
import { DataTransformerView } from './AgentVisualizers/DataTransformerView';
import { FileAnalyzerView } from './AgentVisualizers/FileAnalyzerView';
import { LogAnalyzerView } from './AgentVisualizers/LogAnalyzerView';
import { ProcessManagerView } from './AgentVisualizers/ProcessManagerView';
import { RegexTesterView } from './AgentVisualizers/RegexTesterView';
import { SystemMonitorView } from './AgentVisualizers/SystemMonitorView';
import { SystemOptimizerView } from './AgentVisualizers/SystemOptimizerView';

interface AgentWorkbenchProps {
  agent: AgentMetadata;
  onExecute: (payload: Record<string, unknown>, options: { dryRun: boolean; useAi: boolean }) => Promise<AgentExecutionResponse | null>;
  loading: boolean;
  lastResult: AgentExecutionResponse | null;
}

export const AgentWorkbench: React.FC<AgentWorkbenchProps> = ({
  agent,
  onExecute,
  loading,
  lastResult,
}) => {
  const [payloadText, setPayloadText] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [useAi, setUseAi] = useState(true);
  const [activeOutputTab, setActiveOutputTab] = useState<'visual' | 'ai' | 'raw' | 'curl'>('visual');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Load agent default payload on agent change
  useEffect(() => {
    setPayloadText(JSON.stringify(agent.defaultPayload, null, 2));
    setJsonError(null);
  }, [agent]);

  const handleApplyPreset = (presetPayload: Record<string, unknown>) => {
    setPayloadText(JSON.stringify(presetPayload, null, 2));
    setJsonError(null);
  };

  const handleRun = async () => {
    let parsedPayload: Record<string, unknown> = {};
    if (payloadText.trim().length > 0) {
      try {
        parsedPayload = JSON.parse(payloadText);
        setJsonError(null);
      } catch (err: unknown) {
        setJsonError(err instanceof Error ? err.message : 'Invalid JSON payload');
        return;
      }
    }
    await onExecute(parsedPayload, { dryRun, useAi });
  };

  const curlSnippet = `curl -X POST "${window.location.origin}/api/agents/${agent.id}/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dryRun": ${dryRun},
    "useAi": ${useAi},
    "payload": ${payloadText || '{}'}
  }'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  // Render dedicated visualizer for each agent
  const renderVisualizer = () => {
    if (!lastResult || !lastResult.data) {
      return (
        <div className="flex h-64 flex-col items-center justify-center text-center text-slate-500">
          <Play className="mb-2 h-8 w-8 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">Ready to execute</p>
          <p className="text-xs text-slate-500">
            Click "Execute Safe Agent" to run sandboxed backend logic.
          </p>
        </div>
      );
    }

    switch (agent.id) {
      case 'system-monitor':
        return <SystemMonitorView data={lastResult.data as SystemMetrics} />;
      case 'log-analyzer':
        return <LogAnalyzerView data={lastResult.data as LogAnalysisResult} />;
      case 'process-manager':
        return <ProcessManagerView data={lastResult.data as ProcessManagerResult} />;
      case 'file-analyzer':
        return <FileAnalyzerView data={lastResult.data as FileAnalysisResult} />;
      case 'code-assistant':
        return <CodeAssistantView data={lastResult.data as CodeAnalysisResult} />;
      case 'database-query':
        return <DatabaseQueryView data={lastResult.data as DatabaseQueryResult} />;
      case 'data-transformer':
        return <DataTransformerView data={lastResult.data as DataTransformerResult} />;
      case 'content-analyzer':
        return <ContentAnalyzerView data={lastResult.data as ContentAnalysisResult} />;
      case 'regex-tester':
        return <RegexTesterView data={lastResult.data as RegexTestResult} />;
      case 'system-optimizer':
        return <SystemOptimizerView data={lastResult.data as SystemOptimizationResult} />;
      default:
        return (
          <pre className="p-3 font-mono text-xs text-slate-300">
            {JSON.stringify(lastResult.data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-5 ring-1 ring-slate-800 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">{agent.name}</h2>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30 capitalize">
                {agent.category}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{agent.description}</p>
          </div>

          {/* Safety Policy Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {agent.safetyPolicies.map((policy, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-slate-700/60"
              >
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                {policy}
              </span>
            ))}
          </div>
        </div>

        {/* Preset Scenarios */}
        {agent.presetExamples.length > 0 && (
          <div className="mt-4 border-t border-slate-800/80 pt-3">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Scenario Presets:
            </div>
            <div className="flex flex-wrap gap-2">
              {agent.presetExamples.map((preset, idx) => (
                <button
                  key={idx}
                  id={`preset-btn-${idx}`}
                  onClick={() => handleApplyPreset(preset.payload)}
                  className="rounded-lg bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-slate-700/50 hover:bg-slate-800 hover:text-white transition-all text-left"
                >
                  <span className="font-semibold text-indigo-300">{preset.title}:</span>{' '}
                  <span className="text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Execution Split View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Input Payload & Controls (5 Cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-slate-800 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Input Payload (JSON)
              </span>
              <button
                onClick={() => setPayloadText(JSON.stringify(agent.defaultPayload, null, 2))}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                title="Reset to default payload"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </div>

            {/* Code Editor */}
            <div className="mt-3">
              <textarea
                id="payload-input-editor"
                value={payloadText}
                onChange={(e) => {
                  setPayloadText(e.target.value);
                  setJsonError(null);
                }}
                rows={12}
                className="w-full rounded-xl bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-200 ring-1 ring-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="{}"
              />
              {jsonError && (
                <div className="mt-2 flex items-center gap-1 text-xs text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> {jsonError}
                </div>
              )}
            </div>

            {/* Execution Controls */}
            <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Dry-Run Simulation Mode</span>
                </label>
                <span className="text-[10px] text-slate-500">Non-destructive isolation</span>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-400" />
                    Gemini AI Reasoning
                  </span>
                </label>
                <span className="text-[10px] text-slate-500">Contextual diagnostics</span>
              </div>

              <button
                id="btn-execute-agent"
                onClick={handleRun}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Executing Sandboxed Logic...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white" />
                    <span>Execute {agent.name}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output Workbench & Visualizers (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          {/* Pre-flight Guardrail Status Banner */}
          {lastResult && (
            <div
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 ring-1 ${
                lastResult.safety.level === 'VERIFIED_SAFE'
                  ? 'bg-emerald-950/40 text-emerald-300 ring-emerald-500/30'
                  : lastResult.safety.level === 'CAUTION_RESTRICTED'
                  ? 'bg-amber-950/40 text-amber-300 ring-amber-500/30'
                  : 'bg-rose-950/40 text-rose-300 ring-rose-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {lastResult.safety.level === 'VERIFIED_SAFE' ? (
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider">
                  Guardrail: {lastResult.safety.level.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-xs opacity-80">
                  (Threat Score: {lastResult.safety.threatScore}/100)
                </span>
              </div>
              <span className="text-xs opacity-75">
                Executed in {lastResult.executionTimeMs}ms
              </span>
            </div>
          )}

          {/* Result Tabs Container */}
          <div className="rounded-2xl bg-slate-900/70 p-4 ring-1 ring-slate-800 shadow-md">
            {/* Output Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 ring-1 ring-slate-800">
                <button
                  id="tab-output-visual"
                  onClick={() => setActiveOutputTab('visual')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    activeOutputTab === 'visual'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Visual Result
                </button>
                <button
                  id="tab-output-ai"
                  onClick={() => setActiveOutputTab('ai')}
                  className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    activeOutputTab === 'ai'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  AI Reasoning
                </button>
                <button
                  id="tab-output-raw"
                  onClick={() => setActiveOutputTab('raw')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    activeOutputTab === 'raw'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw JSON
                </button>
                <button
                  id="tab-output-curl"
                  onClick={() => setActiveOutputTab('curl')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                    activeOutputTab === 'curl'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  cURL
                </button>
              </div>

              {lastResult && (
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(lastResult.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Output Tab Body */}
            <div className="mt-4 min-h-[320px]">
              {activeOutputTab === 'visual' && renderVisualizer()}

              {activeOutputTab === 'ai' && (
                <div className="space-y-3 rounded-xl bg-slate-950 p-4 ring-1 ring-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Gemini 3.7 Flash Safe Diagnostic Report
                  </div>
                  {lastResult?.aiExplanation ? (
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                      {lastResult.aiExplanation}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No AI analysis generated. Ensure "Gemini AI Reasoning" is checked and execute the agent.
                    </p>
                  )}
                </div>
              )}

              {activeOutputTab === 'raw' && (
                <pre className="max-h-96 overflow-x-auto rounded-xl bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-200 ring-1 ring-slate-800">
                  {lastResult ? JSON.stringify(lastResult, null, 2) : 'No execution data yet.'}
                </pre>
              )}

              {activeOutputTab === 'curl' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Direct REST backend invocation snippet:
                    </span>
                    <button
                      onClick={handleCopyCurl}
                      className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
                    >
                      <Copy className="h-3 w-3" /> {copiedCurl ? 'Copied!' : 'Copy cURL'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-300 ring-1 ring-slate-800">
                    {curlSnippet}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
