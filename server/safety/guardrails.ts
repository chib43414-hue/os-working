import { AgentId, AuditLogEntry, SafetyCheckResult, SafetyLevel } from '../../src/types';

// In-memory Audit Trail with max 500 entries
const auditLogStore: AuditLogEntry[] = [];

// Regular expressions for PII detection and scrubbing
const PII_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  CREDIT_CARD: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
  AWS_KEY: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
  API_SECRET: /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|bearer)\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{20,}['"]?/gi,
  JWT: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
  IPV4: /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
};

// Dangerous injection patterns (Prompt injections & shell payloads)
const DANGEROUS_PAYLOADS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*override\s*:\s*admin/i,
  /rm\s+-rf\s+[\/\*]/i,
  /chmod\s+-R\s+777/i,
  /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, // Fork bomb
  /DROP\s+DATABASE/i,
  /DROP\s+TABLE\s+(users|customers|accounts|auth)/i,
  /TRUNCATE\s+TABLE/i,
  /exec\s*\(\s*['"]rm/i,
  /mkfs\./i,
  /dd\s+if=\/dev\/zero/i,
];

/**
 * Scrubs known PII from input text and returns sanitized text + count of masked occurrences
 */
export function scrubPii(text: string): { sanitized: string; count: number } {
  let sanitized = text;
  let count = 0;

  for (const [key, regex] of Object.entries(PII_PATTERNS)) {
    sanitized = sanitized.replace(regex, (match) => {
      count++;
      if (key === 'EMAIL') {
        const parts = match.split('@');
        return `${parts[0].charAt(0)}***@${parts[1]}`;
      }
      if (key === 'CREDIT_CARD') {
        return `[REDACTED-CARD-XXXX-${match.slice(-4)}]`;
      }
      if (key === 'SSN') {
        return `[REDACTED-SSN-***-**-${match.slice(-4)}]`;
      }
      if (key === 'JWT') {
        return `[REDACTED-JWT-TOKEN]`;
      }
      if (key === 'AWS_KEY' || key === 'API_SECRET') {
        return `[REDACTED-SECRET-KEY]`;
      }
      return `[REDACTED-${key}]`;
    });
  }

  return { sanitized, count };
}

/**
 * Validates payload against safety rules, prompt injections, and calculates a threat score
 */
export function evaluateSafety(
  agentId: AgentId,
  payload: Record<string, unknown>,
  dryRun = false
): SafetyCheckResult {
  const startTime = Date.now();
  const ruleViolations: string[] = [];
  let threatScore = 0;

  const payloadStr = JSON.stringify(payload);
  const { count: piiCount } = scrubPii(payloadStr);
  const piiDetected = piiCount > 0;

  if (piiDetected) {
    ruleViolations.push(`Detected ${piiCount} sensitive PII token(s). Automated scrubbing active.`);
    threatScore += Math.min(25, piiCount * 5);
  }

  // Check for dangerous injection or destructive payloads
  for (const pattern of DANGEROUS_PAYLOADS) {
    if (pattern.test(payloadStr)) {
      ruleViolations.push(`Hazardous command/injection vector blocked by guardrail: ${pattern.source}`);
      threatScore += 60;
    }
  }

  // Check for dangerous path traversal
  if (/\.\.\/|\.\.\\|%2e%2e%2f/i.test(payloadStr)) {
    ruleViolations.push('Path traversal attempt detected (directory climbing blocked).');
    threatScore += 40;
  }

  // Agent-specific rules
  if (agentId === 'process-manager') {
    const targetPid = Number(payload.targetPid);
    if (targetPid === 0 || targetPid === 1 || targetPid === process.pid) {
      ruleViolations.push(`Termination of kernel or agent host process (PID: ${targetPid}) is strictly prohibited.`);
      threatScore += 75;
    }
  }

  if (agentId === 'file-analyzer') {
    const fileName = String(payload.fileName || '');
    if (/\.(exe|bat|cmd|vbs|scr|pif|hta)$/i.test(fileName)) {
      ruleViolations.push(`Executable binary ingestion warning: ${fileName} flagged for sandbox quarantine.`);
      threatScore += 30;
    }
  }

  if (agentId === 'database-query') {
    const query = String(payload.query || '');
    if (/;\s*(DROP|DELETE|ALTER|UPDATE|INSERT)/i.test(query)) {
      ruleViolations.push('Stacked query detected (potential SQL injection attempt).');
      threatScore += 50;
    }
    if (/--|\/\*|\*\/|@@version|UNION\s+SELECT/i.test(query)) {
      ruleViolations.push('SQL evasion signature or UNION bypass attempt intercepted.');
      threatScore += 45;
    }
  }

  threatScore = Math.min(100, Math.max(0, threatScore));

  let level: SafetyLevel = 'VERIFIED_SAFE';
  if (threatScore >= 60) {
    level = 'BLOCKED_HAZARDOUS';
  } else if (threatScore >= 20 || ruleViolations.length > 0) {
    level = 'CAUTION_RESTRICTED';
  }

  const passed = level !== 'BLOCKED_HAZARDOUS';
  const duration = Date.now() - startTime;

  return {
    passed,
    level,
    ruleViolations,
    piiDetected,
    piiMaskedCount: piiCount,
    threatScore,
    sandboxDurationMs: duration,
    executionMode: !passed ? 'blocked' : dryRun ? 'dry-run' : 'sandboxed-execution',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Records an execution in the audit log store
 */
export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  auditLogStore.unshift(fullEntry);
  if (auditLogStore.length > 500) {
    auditLogStore.pop();
  }

  return fullEntry;
}

/**
 * Returns latest audit logs with optional filtering
 */
export function getAuditLogs(agentId?: AgentId, limit = 50): AuditLogEntry[] {
  if (agentId) {
    return auditLogStore.filter((log) => log.agentId === agentId).slice(0, limit);
  }
  return auditLogStore.slice(0, limit);
}
