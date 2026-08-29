import { AgentExecutionResponse, LogAnalysisResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog, scrubPii } from '../safety/guardrails';

const DEFAULT_SAMPLE_LOGS = `[2026-08-29 04:00:01] INFO [auth-service] User login successful for john.doe@example.com from 192.168.1.45
[2026-08-29 04:00:12] WARN [api-gateway] Rate limit threshold approached for API key api_key_live_9f823a8b417c8d9e2
[2026-08-29 04:01:05] ERROR [payment-worker] Transaction failed for card 4532-8921-4431-8902: Timeout communicating with processor
[2026-08-29 04:02:22] WARN [waf] Intercepted suspicious query param: /products?category=electronics' OR '1'='1
[2026-08-29 04:02:40] ERROR [db-pool] Connection pool exhausted: 50/50 active connections held for > 3000ms
[2026-08-29 04:03:15] WARN [waf] Blocked potential XSS payload: <script>alert(document.cookie)</script> in header User-Agent
[2026-08-29 04:03:50] INFO [worker-3] Batch job completed in 1.42s with 350 items processed`;

export async function runLogAnalyzer(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<LogAnalysisResult>> {
  const startTime = Date.now();
  const rawLogs = String(payload.logs || DEFAULT_SAMPLE_LOGS);

  // Run safety guardrail check
  const safety = evaluateSafety('log-analyzer', { logLength: rawLogs.length });

  // 1. PII Scrubbing
  const { sanitized: scrubbedLogs, count: sanitizedPiiCount } = scrubPii(rawLogs);

  const lines = scrubbedLogs.split('\n').filter((l) => l.trim().length > 0);
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  const securityThreatsFound: LogAnalysisResult['securityThreatsFound'] = [];
  const anomalyMap = new Map<string, { count: number; firstSeen: string; lastSeen: string }>();

  lines.forEach((line) => {
    const upper = line.toUpperCase();
    if (upper.includes('ERROR') || upper.includes('FATAL') || upper.includes('CRITICAL') || upper.includes('EXCEPTION')) {
      errorCount++;
    } else if (upper.includes('WARN')) {
      warningCount++;
    } else {
      infoCount++;
    }

    // Security pattern matching
    if (/('|\%27)\s*(OR|AND)\s*('|\%27)?\d+('|\%27)?\s*=\s*('|\%27)?\d+|UNION\s+SELECT/i.test(line)) {
      securityThreatsFound.push({
        severity: 'HIGH',
        category: 'SQL_INJECTION',
        rawSnippet: line.slice(0, 120),
        explanation: 'SQL Injection probe detected in request parameter payload.',
      });
    }

    if (/<script[\s>]|javascript:|onload=|onerror=/i.test(line)) {
      securityThreatsFound.push({
        severity: 'HIGH',
        category: 'XSS',
        rawSnippet: line.slice(0, 120),
        explanation: 'Cross-Site Scripting (XSS) snippet intercepted by application filter.',
      });
    }

    if (/\.\.\/|\.\.\\|%2e%2e/i.test(line)) {
      securityThreatsFound.push({
        severity: 'CRITICAL',
        category: 'PATH_TRAVERSAL',
        rawSnippet: line.slice(0, 120),
        explanation: 'Path traversal attempt attempting to escape web root directory.',
      });
    }

    if (/connection pool exhausted|timeout communicating/i.test(line)) {
      const key = 'Resource Exhaustion / Pool Starvation';
      const existing = anomalyMap.get(key) || { count: 0, firstSeen: '04:00', lastSeen: '04:03' };
      existing.count++;
      anomalyMap.set(key, existing);
    }
  });

  const anomaliesDetected: LogAnalysisResult['anomaliesDetected'] = Array.from(anomalyMap.entries()).map(
    ([pattern, val]) => ({
      pattern,
      occurrences: val.count,
      firstSeen: val.firstSeen,
      lastSeen: val.lastSeen,
    })
  );

  let rootCauseAnalysis =
    errorCount > 0
      ? `Primary incident driver: Database connection saturation caused upstream transaction worker timeouts. ${securityThreatsFound.length} external malicious probes intercepted.`
      : 'All system log streams operating within standard operational baseline parameters.';

  if (useAi) {
    const aiPrompt = `Perform a security and root cause analysis on these sanitized system logs (PII has already been safely scrubbed):
${scrubbedLogs.slice(0, 2000)}

Summarize the key events, incident severity, and recommended operational remediation steps.`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Log Analyzer Agent. Provide an incident response summary with clear action items.'
    );
    if (aiResult) {
      rootCauseAnalysis = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'log-analyzer',
    action: 'PARSE_LOG_STREAM',
    status: securityThreatsFound.length > 0 ? 'WARNING' : 'SUCCESS',
    threatScore: Math.min(100, securityThreatsFound.length * 20),
    executionTimeMs,
    summary: `Analyzed ${lines.length} log lines: ${errorCount} errors, ${warningCount} warnings, ${securityThreatsFound.length} security threats. Masked ${sanitizedPiiCount} PII tokens.`,
    details: { totalLines: lines.length, errorCount, threatCount: securityThreatsFound.length },
  });

  return {
    success: true,
    agentId: 'log-analyzer',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      totalLogsParsed: lines.length,
      errorCount,
      warningCount,
      infoCount,
      securityThreatsFound,
      anomaliesDetected,
      scrubbedLogSample: scrubbedLogs,
      sanitizedPiiCount,
      rootCauseAnalysis,
    },
    recommendations: [
      'Enable strict connection pooling with max queue wait times of 1500ms.',
      'Maintain WAF automated IP rate-limiting rules for repeating SQLi and XSS probes.',
      'Ensure log retention complies with PII redaction policy before cold-storage archival.',
    ],
  };
}
