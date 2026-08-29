import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Terminal, Activity, RefreshCw, Code } from 'lucide-react';

interface NavbarProps {
  serverStatus: 'online' | 'offline' | 'checking';
  aiEnabled: boolean;
  activeTab: 'agents' | 'pipeline' | 'audit' | 'api-docs' | 'code';
  setActiveTab: (tab: 'agents' | 'pipeline' | 'audit' | 'api-docs' | 'code') => void;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  serverStatus,
  aiEnabled,
  activeTab,
  setActiveTab,
  onRefreshHealth,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-600 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white sm:text-lg">
                SafeAgents
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                10-Agent Engine
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Sandboxed Backend Logic & Safety Governance
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 ring-1 ring-slate-800">
          <button
            id="tab-agents"
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'agents'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Agent Hub</span>
          </button>
          <button
            id="tab-pipeline"
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Multi-Agent Chain</span>
          </button>
          <button
            id="tab-code"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Backend Code</span>
          </button>
          <button
            id="tab-audit"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Audit Trail</span>
          </button>
          <button
            id="tab-api-docs"
            onClick={() => setActiveTab('api-docs')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'api-docs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>API Docs</span>
          </button>
        </nav>

        {/* Server & AI Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
              serverStatus === 'online'
                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
            }`}
            title="Backend server runtime status"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${serverStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline">Backend:</span>
            <span className="capitalize">{serverStatus}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
              aiEnabled
                ? 'bg-purple-500/10 text-purple-300 ring-purple-500/30'
                : 'bg-slate-800 text-slate-400 ring-slate-700'
            }`}
            title={aiEnabled ? 'Gemini 3.7 Flash AI reasoning active' : 'Deterministic fallback mode active'}
          >
            <Sparkles className="h-3 w-3 text-purple-400" />
            <span className="hidden sm:inline">Gemini AI:</span>
            <span>{aiEnabled ? 'Active' : 'Fallback'}</span>
          </div>

          <button
            id="btn-refresh-health"
            onClick={onRefreshHealth}
            aria-label="Refresh health status"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
