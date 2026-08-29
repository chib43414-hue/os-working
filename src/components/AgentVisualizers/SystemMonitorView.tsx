import React from 'react';
import { Activity, AlertTriangle, CheckCircle2, Cpu, HardDrive, MemoryStick, Network, Server } from 'lucide-react';
import { SystemMetrics } from '../../types';

interface SystemMonitorViewProps {
  data: SystemMetrics;
}

export const SystemMonitorView: React.FC<SystemMonitorViewProps> = ({ data }) => {
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${Math.round(mb)} MB`;
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Top Banner Alert */}
      <div
        className={`flex items-center justify-between rounded-xl p-3.5 ring-1 ${
          data.healthStatus === 'HEALTHY'
            ? 'bg-emerald-950/40 text-emerald-300 ring-emerald-500/30'
            : data.healthStatus === 'WARNING'
            ? 'bg-amber-950/40 text-amber-300 ring-amber-500/30'
            : 'bg-rose-950/40 text-rose-300 ring-rose-500/30'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {data.healthStatus === 'HEALTHY' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          )}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              Host Cluster Health: {data.healthStatus}
            </div>
            <p className="text-[11px] opacity-85">
              Uptime: {Math.floor(data.uptimeSeconds / 3600)}h {Math.floor((data.uptimeSeconds % 3600) / 60)}m {data.uptimeSeconds % 60}s | Sampled: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <span className="rounded-md bg-slate-900/80 px-2.5 py-1 font-mono text-xs font-semibold ring-1 ring-white/10">
          Latency: {data.eventLoop.latencyMs}ms ({data.eventLoop.status})
        </span>
      </div>

      {/* Metrics 4-Box Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <div className="rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <Cpu className="h-4 w-4 text-indigo-400" /> CPU Allocation
            </span>
            <span className="font-mono text-xs font-bold text-slate-200">{data.cpu.usagePercent}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-indigo-500 transition-all"
              style={{ width: `${Math.min(100, data.cpu.usagePercent)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>Cores: {data.cpu.cores}</span>
            <span>Load: {data.cpu.loadAverage.join(', ')}</span>
          </div>
        </div>

        {/* Memory */}
        <div className="rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <MemoryStick className="h-4 w-4 text-sky-400" /> RAM Footprint
            </span>
            <span className="font-mono text-xs font-bold text-slate-200">{data.memory.usagePercent}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-sky-500 transition-all"
              style={{ width: `${Math.min(100, data.memory.usagePercent)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>Used: {formatBytes(data.memory.usedBytes)}</span>
            <span>Total: {formatBytes(data.memory.totalBytes)}</span>
          </div>
        </div>

        {/* Disk */}
        <div className="rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <HardDrive className="h-4 w-4 text-emerald-400" /> Storage
            </span>
            <span className="font-mono text-xs font-bold text-slate-200">{data.disk.usagePercent}%</span>
          </div>
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, data.disk.usagePercent)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400">
            <span>Mount: {data.disk.virtualMount}</span>
            <span>Free: {formatBytes(data.disk.freeBytes)}</span>
          </div>
        </div>

        {/* Network & Loop */}
        <div className="rounded-xl bg-slate-900/60 p-3.5 ring-1 ring-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <Network className="h-4 w-4 text-purple-400" /> Network / I/O
            </span>
            <span className="font-mono text-xs font-bold text-slate-200">{data.network.activeConnections} conns</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Heap Used: {formatBytes(data.memory.processHeapUsedBytes)}</span>
            <span>RSS: {formatBytes(data.memory.processRssBytes)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>In: {formatBytes(data.network.bytesIn)}</span>
            <span>Out: {formatBytes(data.network.bytesOut)}</span>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <div className="space-y-2 rounded-xl bg-slate-900/40 p-3 ring-1 ring-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Threshold Alerts ({data.activeAlerts.length})
          </div>
          <div className="space-y-1.5">
            {data.activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-lg bg-slate-950/60 px-3 py-2 text-xs ring-1 ring-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {alert.severity}
                  </span>
                  <span className="font-medium text-slate-200">{alert.metric}</span>
                </div>
                <span className="text-slate-400">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
