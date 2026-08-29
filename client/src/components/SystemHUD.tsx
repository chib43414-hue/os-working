import React, { useState, useEffect } from 'react';
import { Activity, Zap, HardDrive, Wifi } from 'lucide-react';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  activeAgents: number;
  tasksCompleted: number;
  uptime: string;
}

export const SystemHUD: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    disk: Math.random() * 100,
    network: Math.random() * 100,
    activeAgents: 0,
    tasksCompleted: 0,
    uptime: '00:00:00',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 5)),
        disk: prev.disk,
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 20)),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatMetric = (value: number) => Math.round(value);

  return (
    <div className="system-hud p-3 space-y-2 text-xs font-mono">
      <div className="text-center text-neon-cyan font-bold mb-2">
        ╔════════════════════════╗
        <br />
        ║  SYSTEM STATUS - JARVIS ║
        <br />
        ╚════════════════════════╝
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-neon-green" />
          <span>CPU: {formatMetric(metrics.cpu)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity size={12} className="text-neon-green" />
          <span>RAM: {formatMetric(metrics.memory)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <HardDrive size={12} className="text-neon-green" />
          <span>DISK: {formatMetric(metrics.disk)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi size={12} className="text-neon-green" />
          <span>NET: {formatMetric(metrics.network)}%</span>
        </div>
      </div>

      <div className="border-t border-neon-cyan pt-2 mt-2">
        <div className="flex justify-between text-neon-green">
          <span>AGENTS: {metrics.activeAgents}</span>
          <span>TASKS: {metrics.tasksCompleted}</span>
        </div>
        <div className="text-neon-magenta">UPTIME: {metrics.uptime}</div>
      </div>

      <div className="text-center text-neon-cyan text-xs mt-2">
        ▓▓▓▓▓▓▓▓▓▓ 100%
      </div>
    </div>
  );
};

export default SystemHUD;
