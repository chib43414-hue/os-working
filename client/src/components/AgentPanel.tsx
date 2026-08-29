import React, { useState, useEffect } from 'react';
import TerminalPanel from './TerminalPanel';

interface Agent {
  id: string;
  name: string;
  category: string;
  status: 'idle' | 'busy' | 'error';
  description: string;
  tasksCompleted: number;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 'osint-agent',
    name: 'OSINT Agent',
    category: 'Security',
    status: 'idle',
    description: 'Open-source intelligence gathering',
    tasksCompleted: 12,
  },
  {
    id: 'network-scanner',
    name: 'Network Scanner',
    category: 'Security',
    status: 'idle',
    description: 'Port scanning and service enumeration',
    tasksCompleted: 8,
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    category: 'Development',
    status: 'idle',
    description: 'Code analysis and debugging',
    tasksCompleted: 24,
  },
  {
    id: 'system-monitor',
    name: 'System Monitor',
    category: 'Infrastructure',
    status: 'busy',
    description: 'Real-time system metrics',
    tasksCompleted: 156,
  },
  {
    id: 'log-analyzer',
    name: 'Log Analyzer',
    category: 'Infrastructure',
    status: 'idle',
    description: 'Parse and analyze system logs',
    tasksCompleted: 45,
  },
  {
    id: 'web-scraper',
    name: 'Web Scraper',
    category: 'Data',
    status: 'idle',
    description: 'Extract data from websites',
    tasksCompleted: 31,
  },
];

export const AgentPanel: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);

  useEffect(() => {
    // Simulate agent status changes
    const interval = setInterval(() => {
      setAgents(prev =>
        prev.map(agent => ({
          ...agent,
          status: Math.random() > 0.7 ? 'busy' : agent.status === 'busy' ? 'idle' : agent.status,
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'busy':
        return 'text-neon-magenta';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-neon-green';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'busy':
        return '◐';
      case 'error':
        return '✕';
      default:
        return '●';
    }
  };

  return (
    <TerminalPanel
      id="AGENTS"
      title="Agent Registry"
      headerColor="cyan"
      className="w-full"
    >
      <div className="space-y-2 text-xs font-mono">
        <div className="text-neon-cyan mb-3">
          ╔════════════════════════════════════════╗
          <br />
          ║ AVAILABLE AGENTS: {agents.length.toString().padStart(2, '0')} ║
          <br />
          ╚════════════════════════════════════════╝
        </div>

        <div className="space-y-1">
          {agents.map(agent => (
            <div
              key={agent.id}
              className={`p-2 border border-neon-cyan/30 hover:border-neon-cyan transition-colors ${getStatusColor(agent.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${getStatusColor(agent.status)}`}>
                    {getStatusIndicator(agent.status)}
                  </span>
                  <span className="font-bold">{agent.name}</span>
                  <span className="text-neon-cyan opacity-50">[{agent.category}]</span>
                </div>
                <span className="text-neon-green">{agent.tasksCompleted}</span>
              </div>
              <div className="text-neon-cyan opacity-70 text-xs mt-1">
                {agent.description}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-2 border-t border-neon-cyan text-neon-cyan text-xs">
          <div>Total Agents: {agents.length}</div>
          <div>Active: {agents.filter(a => a.status === 'busy').length}</div>
          <div>Idle: {agents.filter(a => a.status === 'idle').length}</div>
        </div>
      </div>
    </TerminalPanel>
  );
};

export default AgentPanel;
