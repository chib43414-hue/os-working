import React, { useEffect, useState } from 'react';
import { AgentCategory, AgentExecutionResponse, AgentId, AgentMetadata } from './types';
import { Navbar } from './components/Navbar';
import { AgentSelector } from './components/AgentSelector';
import { AgentWorkbench } from './components/AgentWorkbench';
import { PipelineRunner } from './components/PipelineRunner';
import { AuditLogView } from './components/AuditLogView';
import { ApiDocsView } from './components/ApiDocsView';
import { BackendCodeViewer } from './components/BackendCodeViewer';


export default function App() {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('system-monitor');
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'agents' | 'pipeline' | 'audit' | 'api-docs' | 'code'>('agents');
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastResults, setLastResults] = useState<Record<AgentId, AgentExecutionResponse | null>>({
    'system-monitor': null,
    'log-analyzer': null,
    'process-manager': null,
    'file-analyzer': null,
    'code-assistant': null,
    'database-query': null,
    'data-transformer': null,
    'content-analyzer': null,
    'regex-tester': null,
    'system-optimizer': null,
  });

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerStatus('online');
        setAiEnabled(!!data.aiPowered);
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents/list');
      if (res.ok) {
        const data = await res.json();
        if (data.agents && data.agents.length > 0) {
          setAgents(data.agents);
        }
      }
    } catch (e) {
      console.warn('Using client agent definitions fallback:', e);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchAgents();
    // Auto-execute default System Monitor for immediate live feedback
    handleExecute('system-monitor', {}, { dryRun: true, useAi: false });
  }, []);

  const handleExecute = async (
    agentId: AgentId,
    payload: Record<string, unknown>,
    options: { dryRun: boolean; useAi: boolean }
  ): Promise<AgentExecutionResponse | null> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          dryRun: options.dryRun,
          useAi: options.useAi,
        }),
      });

      const data: AgentExecutionResponse = await res.json();
      setLastResults((prev) => ({
        ...prev,
        [agentId]: data,
      }));
      return data;
    } catch (err) {
      console.error(`Execution error for agent ${agentId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        serverStatus={serverStatus}
        aiEnabled={aiEnabled}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefreshHealth={checkHealth}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Sidebar: 10 Agent Selector (3.5 Cols) */}
            <div className="lg:col-span-4 xl:col-span-3.5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Agent Roster (10)
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                  Sandboxed & Safe
                </span>
              </div>
              <AgentSelector
                agents={agents}
                selectedAgentId={selectedAgentId}
                onSelectAgent={(id) => setSelectedAgentId(id)}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>

            {/* Right: Selected Agent Interactive Workbench (8.5 Cols) */}
            <div className="lg:col-span-8 xl:col-span-8.5">
              <AgentWorkbench
                agent={selectedAgent}
                onExecute={(payload, options) =>
                  handleExecute(selectedAgentId, payload, options)
                }
                loading={loading}
                lastResult={lastResults[selectedAgentId]}
              />
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && <PipelineRunner agents={agents} />}
        {activeTab === 'code' && <BackendCodeViewer />}
        {activeTab === 'audit' && <AuditLogView />}
        {activeTab === 'api-docs' && <ApiDocsView agents={agents} />}
      </main>
    </div>
  );
}
