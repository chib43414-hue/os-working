import { AgentExecutionResponse, ProcessInfo, ProcessManagerResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog } from '../safety/guardrails';

const SEEDED_PROCESSES: ProcessInfo[] = [
  {
    pid: 1,
    name: 'systemd / init',
    cpuUsage: 0.1,
    memoryUsageMb: 14.2,
    status: 'RUNNING',
    isProtected: true,
    priority: 'CRITICAL',
    threatRiskScore: 0,
    command: '/sbin/init',
    startTime: '2026-08-28 00:00:00',
  },
  {
    pid: 142,
    name: 'safe-agents-server',
    cpuUsage: 1.8,
    memoryUsageMb: 88.5,
    status: 'RUNNING',
    isProtected: true,
    priority: 'HIGH',
    threatRiskScore: 0,
    command: 'tsx server.ts --port 3000',
    startTime: '2026-08-29 03:30:15',
  },
  {
    pid: 408,
    name: 'postgres-worker-pool',
    cpuUsage: 4.2,
    memoryUsageMb: 145.0,
    status: 'RUNNING',
    isProtected: false,
    priority: 'NORMAL',
    threatRiskScore: 5,
    command: 'postgres: pool worker idle',
    startTime: '2026-08-29 03:31:00',
  },
  {
    pid: 890,
    name: 'orphaned-crypto-miner.tmp',
    cpuUsage: 94.5,
    memoryUsageMb: 340.2,
    status: 'LOCKED',
    isProtected: false,
    priority: 'LOW',
    threatRiskScore: 92,
    command: '/tmp/.hidden/xmrig --daemon --cpu-priority 5',
    startTime: '2026-08-29 03:55:10',
  },
  {
    pid: 921,
    name: 'defunct-pdf-renderer',
    cpuUsage: 0.0,
    memoryUsageMb: 0.0,
    status: 'ZOMBIE',
    isProtected: false,
    priority: 'LOW',
    threatRiskScore: 40,
    command: '<defunct> chromium-headless',
    startTime: '2026-08-29 03:58:20',
  },
  {
    pid: 1045,
    name: 'redis-cache-server',
    cpuUsage: 0.8,
    memoryUsageMb: 62.1,
    status: 'RUNNING',
    isProtected: false,
    priority: 'NORMAL',
    threatRiskScore: 0,
    command: 'redis-server *:6379',
    startTime: '2026-08-29 03:31:10',
  },
];

export async function runProcessManager(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<ProcessManagerResult>> {
  const startTime = Date.now();
  const targetPid = payload.targetPid !== undefined ? Number(payload.targetPid) : null;
  const signal = String(payload.signal || 'SIGTERM').toUpperCase();
  const dryRun = payload.dryRun !== false;

  const safety = evaluateSafety('process-manager', { targetPid, signal, dryRun });

  let actionTaken: ProcessManagerResult['actionTaken'];

  if (targetPid !== null) {
    const targetProcess = SEEDED_PROCESSES.find((p) => p.pid === targetPid);

    if (!targetProcess) {
      actionTaken = {
        signal,
        targetPid,
        result: 'SIMULATED_SUCCESS',
        message: `Process PID ${targetPid} not found or has already terminated cleanly.`,
      };
    } else if (targetProcess.isProtected) {
      actionTaken = {
        signal,
        targetPid,
        result: 'DENIED_PROTECTED_PROCESS',
        message: `Safety Policy Violation: PID ${targetPid} (${targetProcess.name}) is a protected core runtime service and cannot be signaled.`,
      };
    } else {
      actionTaken = {
        signal,
        targetPid,
        result: dryRun ? 'SIMULATED_SUCCESS' : 'EXECUTED_SAFE_TERMINATION',
        message: `${dryRun ? '[DRY RUN] Would safely issue' : 'Safely dispatched'} ${signal} to PID ${targetPid} (${targetProcess.name}). Resources scheduled for reclamation.`,
      };
    }
  }

  const highRiskCount = SEEDED_PROCESSES.filter((p) => p.threatRiskScore > 50).length;
  const zombieCount = SEEDED_PROCESSES.filter((p) => p.status === 'ZOMBIE').length;
  const resourceHogCount = SEEDED_PROCESSES.filter((p) => p.cpuUsage > 50 || p.memoryUsageMb > 250).length;

  const suggestions: string[] = [
    'Flagged PID 890 (orphaned-crypto-miner.tmp) as critical threat (CPU: 94.5%, Risk Score: 92). Recommended action: Terminate.',
    'Reap zombie PID 921 (<defunct> chromium-headless) to free kernel process table descriptors.',
    'Protected core processes (PID 1, PID 142) verified shielded from accidental signal disruption.',
  ];

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Analyze the current process tree metrics and summarize security/operational status:
Processes: ${JSON.stringify(SEEDED_PROCESSES)}
Action Request: Target PID ${targetPid ?? 'None'}, Signal ${signal}, DryRun: ${dryRun}`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Process Manager Agent. Provide a safe process governance evaluation.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'process-manager',
    action: targetPid ? `SIGNAL_${signal}` : 'PROCESS_INSPECTION',
    status: actionTaken?.result === 'DENIED_PROTECTED_PROCESS' ? 'BLOCKED' : 'SUCCESS',
    threatScore: targetPid === 1 ? 90 : safety.threatScore,
    executionTimeMs,
    summary: targetPid
      ? `Signal ${signal} evaluated for PID ${targetPid}: ${actionTaken?.result}`
      : `Scanned ${SEEDED_PROCESSES.length} processes: ${highRiskCount} high risk, ${zombieCount} zombie.`,
    details: { targetPid, signal, actionTaken },
  });

  return {
    success: true,
    agentId: 'process-manager',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      processes: SEEDED_PROCESSES,
      totalProcesses: SEEDED_PROCESSES.length,
      highRiskCount,
      zombieCount,
      resourceHogCount,
      actionTaken,
      suggestions,
    },
    aiExplanation,
  };
}
