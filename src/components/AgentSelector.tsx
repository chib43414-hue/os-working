import React from 'react';
import {
  Activity,
  FileSearch,
  Cpu,
  ShieldCheck,
  Code2,
  Database,
  Shuffle,
  FileText,
  Regex,
  Zap,
} from 'lucide-react';
import { AgentCategory, AgentId, AgentMetadata } from '../types';

interface AgentSelectorProps {
  agents: AgentMetadata[];
  selectedAgentId: AgentId;
  onSelectAgent: (id: AgentId) => void;
  selectedCategory: AgentCategory | 'all';
  onSelectCategory: (cat: AgentCategory | 'all') => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  Activity: <Activity className="h-4 w-4" />,
  FileSearch: <FileSearch className="h-4 w-4" />,
  Cpu: <Cpu className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
  Code2: <Code2 className="h-4 w-4" />,
  Database: <Database className="h-4 w-4" />,
  Shuffle: <Shuffle className="h-4 w-4" />,
  FileText: <FileText className="h-4 w-4" />,
  Regex: <Regex className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
};

const CATEGORIES: Array<{ id: AgentCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All 10 Agents' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'security-logs', label: 'Security & Logs' },
  { id: 'code-data', label: 'Code & Data' },
  { id: 'intelligence', label: 'Intelligence' },
];

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  selectedCategory,
  onSelectCategory,
}) => {
  const filteredAgents =
    selectedCategory === 'all'
      ? agents
      : agents.filter((a) => a.category === selectedCategory);

  return (
    <div className="space-y-3">
      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            id={`filter-cat-${cat.id}`}
            onClick={() => onSelectCategory(cat.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-indigo-400 ring-1 ring-indigo-500/40'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Agents */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {filteredAgents.map((agent, index) => {
          const isSelected = agent.id === selectedAgentId;
          return (
            <button
              key={agent.id}
              id={`agent-card-${agent.id}`}
              onClick={() => onSelectAgent(agent.id)}
              className={`group flex items-start gap-3 rounded-xl p-3 text-left transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-950/70 to-slate-900 text-white shadow-md ring-1 ring-indigo-500/50'
                  : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900 hover:text-white ring-1 ring-slate-800/80'
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'
                }`}
              >
                {ICONS_MAP[agent.icon] || <Activity className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-bold text-slate-100">
                    <span className="text-slate-500 mr-1.5 font-mono">0{index + 1}.</span>
                    {agent.name}
                  </span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.2 text-[10px] font-medium uppercase tracking-wider ${
                      isSelected
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {agent.category}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                  {agent.tagline}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
