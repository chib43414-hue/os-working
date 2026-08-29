import { AgentExecutionRequest, AgentExecutionResponse, AgentId, AgentMetadata } from '../../src/types';
import { runCodeAssistant } from './codeAssistant';
import { runContentAnalyzer } from './contentAnalyzer';
import { runDatabaseQuery } from './databaseQuery';
import { runDataTransformer } from './dataTransformer';
import { runFileAnalyzer } from './fileAnalyzer';
import { runLogAnalyzer } from './logAnalyzer';
import { runProcessManager } from './processManager';
import { runRegexTester } from './regexTester';
import { runSystemMonitor } from './systemMonitor';
import { runSystemOptimizer } from './systemOptimizer';

export const AGENTS_METADATA: AgentMetadata[] = [
  {
    id: 'system-monitor',
    name: 'System Monitor',
    category: 'infrastructure',
    tagline: 'Real-time telemetry, resource metrics & health diagnostics',
    description: 'Continuously measures CPU load, memory heap, event loop lag, and hardware health metrics with zero invasive system mutation.',
    icon: 'Activity',
    safetyPolicies: [
      'Read-only metric collection',
      'Bounded sampling frequency (anti-DDoS)',
      'Zero kernel modification privileges',
    ],
    allowedOperations: ['GET_METRICS', 'HEALTH_CHECK', 'LOOP_LATENCY_PROBE'],
    prohibitedOperations: ['SYSTEM_REBOOT', 'KERNEL_PARAM_WRITE', 'HARDWARE_OVERCLOCK'],
    defaultPayload: {},
    presetExamples: [
      {
        title: 'Full System Health Scan',
        description: 'Probe host CPU, memory, disk, and event loop latency.',
        payload: { detailLevel: 'comprehensive' },
      },
    ],
  },
  {
    id: 'log-analyzer',
    name: 'Log Analyzer',
    category: 'security-logs',
    tagline: 'Automated PII scrubbing, error clustering & attack detection',
    description: 'Parses server logs, syslogs, and stack traces. Identifies SQLi, XSS, and authorization anomalies with automated PII masking.',
    icon: 'FileSearch',
    safetyPolicies: [
      'Automated PII & credential redaction before AI ingestion',
      'Sandboxed log stream parsing',
      'Memory-bounded processing (10MB max)',
    ],
    allowedOperations: ['PARSE_LOGS', 'SCRUB_PII', 'CLUSTER_ERRORS', 'THREAT_SCAN'],
    prohibitedOperations: ['LOG_TAMPERING', 'RAW_PII_EXFILTRATION', 'AUDIT_DELETION'],
    defaultPayload: {},
    presetExamples: [
      {
        title: 'Detect Security Probes & Mask PII',
        description: 'Scan access logs with SQL injection attempts and user emails.',
        payload: {
          logs: `[2026-08-29 04:00:01] INFO [auth] User login for sarah.connor@cyber.io from 10.0.4.12
[2026-08-29 04:01:22] WARN [waf] Intercepted payload: /api/search?q=' UNION SELECT username, password_hash FROM admin_users--
[2026-08-29 04:02:11] ERROR [billing] Card 4111-2222-3333-4444 expired during settlement
[2026-08-29 04:03:00] WARN [firewall] Blocked path traversal: GET /../../etc/shadow HTTP/1.1`,
        },
      },
    ],
  },
  {
    id: 'process-manager',
    name: 'Process Manager',
    category: 'infrastructure',
    tagline: 'Safe process governance, zombie detection & resource limits',
    description: 'Inspects active process trees, flags orphaned/crypto-mining runaway processes, and provides dry-run signal coordination.',
    icon: 'Cpu',
    safetyPolicies: [
      'Protected process shield (PID 1, kernel, agent host immune)',
      'Signal whitelist (SIGTERM, SIGHUP simulation only)',
      'Mandatory dry-run simulation mode',
    ],
    allowedOperations: ['INSPECT_TREE', 'SIMULATE_SIGNAL', 'ZOMBIE_REAP_PROBE'],
    prohibitedOperations: ['KILL_PID_1', 'RAW_SIGKILL_HOST', 'FORK_BOMB_SPAWN'],
    defaultPayload: { targetPid: 890, signal: 'SIGTERM', dryRun: true },
    presetExamples: [
      {
        title: 'Inspect Process Tree',
        description: 'Scan running processes for resource hogs and zombie tasks.',
        payload: { dryRun: true },
      },
      {
        title: 'Dry-Run Terminate Runaway Process',
        description: 'Safely evaluate signal termination of high-risk PID 890.',
        payload: { targetPid: 890, signal: 'SIGTERM', dryRun: true },
      },
      {
        title: 'Attempt Shielded Process Signal (Safety Block)',
        description: 'Demonstrates policy block when targeting core init PID 1.',
        payload: { targetPid: 1, signal: 'SIGKILL', dryRun: false },
      },
    ],
  },
  {
    id: 'file-analyzer',
    name: 'File Analyzer',
    category: 'security-logs',
    tagline: 'Shannon entropy, hash verification & secret detection',
    description: 'Evaluates file integrity, calculates entropy to spot ransomware/packing, scans for leaked API keys, and validates syntax.',
    icon: 'ShieldCheck',
    safetyPolicies: [
      'Path traversal jail restriction',
      'Read-only inspection sandbox',
      'Dangerous executable quarantine',
    ],
    allowedOperations: ['CALCULATE_ENTROPY', 'SHA256_VERIFY', 'SECRET_SCAN', 'SYNTAX_LINT'],
    prohibitedOperations: ['EXECUTE_BINARY', 'OVERWRITE_SYSTEM_FILES', 'DIR_TRAVERSAL'],
    defaultPayload: { fileName: 'production.env' },
    presetExamples: [
      {
        title: 'Scan Leaked Credentials in Config',
        description: 'Detect AWS access keys, JWT secrets, and database passwords.',
        payload: {
          fileName: 'production.env',
          content: `DATABASE_URL=postgres://root:p@ssw0rd123@db.prod:5432/app
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...[SECRET]`,
        },
      },
      {
        title: 'Evaluate Ransomware / Encrypted Entropy',
        description: 'High entropy score analysis on obfuscated binary payload.',
        payload: {
          fileName: 'suspicious_payload.bin',
          content: '8f#a9$!zK9@1vL0#mQ8%2pW4&9rT1*3yU5(7iO6)8eR2_0tY4+6uI8=2oP0[4aS1]7dF3{9gH5}1jK7|3lZ9:5xC1;7vB3<9nM5>1qW7?3eR9',
        },
      },
    ],
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    category: 'code-data',
    tagline: 'Static vulnerability audit, complexity analysis & refactoring',
    description: 'Audits code against OWASP Top 10 vulnerabilities (CWE-78, CWE-95, CWE-798), computes cognitive complexity, and generates hardened patches.',
    icon: 'Code2',
    safetyPolicies: [
      'Pure static analysis (no remote code execution)',
      'AST-level rule evaluation',
      'Strict input size boundaries',
    ],
    allowedOperations: ['STATIC_LINT', 'COMPLEXITY_EVAL', 'PATCH_GEN', 'UNIT_TEST_GEN'],
    prohibitedOperations: ['SHELL_EXEC', 'RUNTIME_EVAL', 'FS_WRITE'],
    defaultPayload: { language: 'typescript' },
    presetExamples: [
      {
        title: 'Audit Vulnerable Node.js Controller',
        description: 'Detect command injection (exec) and insecure eval in API handler.',
        payload: {
          language: 'typescript',
          code: `import { exec } from 'child_process';

export function handleUserReport(req, res) {
  const file = req.query.filename;
  // Vulnerability: CWE-78 Command Injection
  exec("cat /reports/" + file, (err, data) => {
    // Vulnerability: CWE-95 Insecure Eval
    const report = eval("(" + data + ")");
    res.json(report);
  });
}`,
        },
      },
    ],
  },
  {
    id: 'database-query',
    name: 'Database Query',
    category: 'code-data',
    tagline: 'Safe SQL execution sandbox & injection firewall',
    description: 'Translates and executes analytical queries in an isolated in-memory relational sandbox. Intercepts SQL injection probes.',
    icon: 'Database',
    safetyPolicies: [
      'SQL injection firewall (UNION, stacked query & comment evasion block)',
      'Query execution timeout (500ms max)',
      'Immutable schema isolation',
    ],
    allowedOperations: ['SELECT_SANDBOX', 'EXPLAIN_QUERY_PLAN', 'SYNTAX_CHECK'],
    prohibitedOperations: ['DROP_DATABASE', 'TRUNCATE_TABLE', 'RAW_SOCKET_CONNECT'],
    defaultPayload: {
      query: "SELECT id, name, email, role, status FROM users WHERE status = 'active' ORDER BY id ASC LIMIT 5;",
      dryRun: true,
    },
    presetExamples: [
      {
        title: 'Analytical Query on Users Table',
        description: 'Safe query with index plan breakdown.',
        payload: {
          query: "SELECT id, name, role FROM users WHERE role = 'admin';",
          dryRun: true,
        },
      },
      {
        title: 'SQL Injection Attack Simulation (Blocked)',
        description: 'Demonstrates SQL firewall intercepting a UNION exfiltration query.',
        payload: {
          query: "SELECT * FROM users WHERE id = 1 UNION SELECT 1, 'hacked', password_hash, 'admin', 'active' FROM auth_passwords--",
          dryRun: false,
        },
      },
    ],
  },
  {
    id: 'data-transformer',
    name: 'Data Transformer',
    category: 'code-data',
    tagline: 'Universal format conversion, schema inference & data masking',
    description: 'Converts seamlessly between JSON, CSV, YAML, XML, Markdown, and NDJSON with automatic schema inference and PII masking.',
    icon: 'Shuffle',
    safetyPolicies: [
      'Protection against XML Billion Laughs entity expansion',
      'Prototype pollution immunity',
      'Circular reference defense',
    ],
    allowedOperations: ['CONVERT_FORMAT', 'INFER_SCHEMA', 'MASK_DATA', 'NORMALIZE_KEYS'],
    prohibitedOperations: ['UNSAFE_DESERIALIZE', 'PROTOTYPE_MUTATE', 'UNBOUNDED_EXPAND'],
    defaultPayload: {
      inputFormat: 'JSON',
      outputFormat: 'CSV',
      maskPii: true,
    },
    presetExamples: [
      {
        title: 'Convert JSON to CSV with PII Masking',
        description: 'Transforms employee dataset to CSV with masked email addresses.',
        payload: {
          inputFormat: 'JSON',
          outputFormat: 'CSV',
          maskPii: true,
        },
      },
      {
        title: 'Convert JSON to Markdown Table',
        description: 'Generate clean documentation tables from structured JSON objects.',
        payload: {
          inputFormat: 'JSON',
          outputFormat: 'MARKDOWN',
          maskPii: false,
        },
      },
    ],
  },
  {
    id: 'content-analyzer',
    name: 'Content Analyzer',
    category: 'intelligence',
    tagline: 'Readability metrics, sentiment analysis & compliance audit',
    description: 'Calculates Flesch-Kincaid reading scores, evaluates sentiment & toxicity, detects PII entities, and audits GDPR/HIPAA compliance.',
    icon: 'FileText',
    safetyPolicies: [
      'Input sanitization against prompt injection',
      'Automated redaction output preview',
      'Content moderation threshold checks',
    ],
    allowedOperations: ['READABILITY_SCORE', 'SENTIMENT_EVAL', 'COMPLIANCE_AUDIT', 'PII_EXTRACT'],
    prohibitedOperations: ['PROMPT_INJECTION_PASSTHROUGH', 'TOXIC_AMPLIFY'],
    defaultPayload: {},
    presetExamples: [
      {
        title: 'Audit Medical Incident Report (HIPAA/PCI)',
        description: 'Scans clinical document for patient SSN, credit cards, and readability.',
        payload: {},
      },
    ],
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    category: 'intelligence',
    tagline: 'ReDoS vulnerability detection, match tester & pattern explainer',
    description: 'Safely evaluates regular expressions with step-counter circuit breakers. Flags catastrophic backtracking (ReDoS) hazards.',
    icon: 'Regex',
    safetyPolicies: [
      'ReDoS catastrophic backtracking detector',
      'Execution step limit circuit breaker',
      'Strict regex engine timeout',
    ],
    allowedOperations: ['EVAL_REGEX', 'REDOS_AUDIT', 'EXPLAIN_TOKENS', 'SYNTHESIZE_TESTS'],
    prohibitedOperations: ['UNBOUNDED_BACKTRACK', 'ENGINE_STARVATION'],
    defaultPayload: {
      pattern: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$',
      flags: 'g',
      testText: 'contact admin@safe-agents.io or team@corp.com',
    },
    presetExamples: [
      {
        title: 'Safe Email Validator Regex',
        description: 'Evaluates email matching with token breakdown.',
        payload: {
          pattern: '^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$',
          flags: 'g',
          testText: 'user@example.com, invalid-email@, test.person@company.org',
        },
      },
      {
        title: 'ReDoS Catastrophic Backtracking Attack Pattern (Flagged)',
        description: 'Demonstrates ReDoS detector flagging nested quantifier `(a+)+$` vulnerability.',
        payload: {
          pattern: '^(a+)+$',
          flags: 'g',
          testText: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!',
        },
      },
    ],
  },
  {
    id: 'system-optimizer',
    name: 'System Optimizer',
    category: 'infrastructure',
    tagline: 'Holistic performance tuning, configuration patches & benchmarks',
    description: 'Analyzes cluster bottlenecks across V8 GC, connection pooling, HTTP/2 keep-alive, and generates diff patches with rollback plans.',
    icon: 'Zap',
    safetyPolicies: [
      'Risk-rated recommendation scoring (Low/Medium/High)',
      'Automated rollback script generation',
      'Zero unexpected downtime rule',
    ],
    allowedOperations: ['AUDIT_CONFIG', 'GENERATE_PATCH', 'BENCHMARK_SIMULATE', 'ROLLBACK_PLAN'],
    prohibitedOperations: ['DESTRUCTIVE_AUTO_APPLY', 'PRODUCTION_DATABASE_RESET'],
    defaultPayload: { targetSystem: 'High-Throughput API Gateway & Cluster' },
    presetExamples: [
      {
        title: 'Full Production Optimization Audit',
        description: 'Generate V8 heap, database pool, and keep-alive configuration patches.',
        payload: { targetSystem: 'High-Throughput API Gateway & Cluster' },
      },
    ],
  },
];

/**
 * Universal Agent Execution Dispatcher
 */
export async function executeAgent(
  agentId: AgentId,
  payload: Record<string, unknown> = {},
  options: { dryRun?: boolean; useAi?: boolean } = {}
): Promise<AgentExecutionResponse> {
  const useAi = options.useAi ?? true;

  switch (agentId) {
    case 'system-monitor':
      return await runSystemMonitor(payload, useAi);
    case 'log-analyzer':
      return await runLogAnalyzer(payload, useAi);
    case 'process-manager':
      return await runProcessManager(payload, useAi);
    case 'file-analyzer':
      return await runFileAnalyzer(payload, useAi);
    case 'code-assistant':
      return await runCodeAssistant(payload, useAi);
    case 'database-query':
      return await runDatabaseQuery(payload, useAi);
    case 'data-transformer':
      return await runDataTransformer(payload, useAi);
    case 'content-analyzer':
      return await runContentAnalyzer(payload, useAi);
    case 'regex-tester':
      return await runRegexTester(payload, useAi);
    case 'system-optimizer':
      return await runSystemOptimizer(payload, useAi);
    default:
      throw new Error(`Unknown agent: ${agentId}`);
  }
}
