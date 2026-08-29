/**
 * Shared types for the 10 Safe Agents platform
 */

export type AgentId =
  | 'system-monitor'
  | 'log-analyzer'
  | 'process-manager'
  | 'file-analyzer'
  | 'code-assistant'
  | 'database-query'
  | 'data-transformer'
  | 'content-analyzer'
  | 'regex-tester'
  | 'system-optimizer';

export type AgentCategory = 'infrastructure' | 'security-logs' | 'code-data' | 'intelligence';

export type SafetyLevel = 'VERIFIED_SAFE' | 'CAUTION_RESTRICTED' | 'BLOCKED_HAZARDOUS';

export interface SafetyCheckResult {
  passed: boolean;
  level: SafetyLevel;
  ruleViolations: string[];
  piiDetected: boolean;
  piiMaskedCount: number;
  threatScore: number; // 0 to 100
  sandboxDurationMs: number;
  executionMode: 'dry-run' | 'sandboxed-execution' | 'ai-augmented' | 'blocked';
  timestamp: string;
}

export interface AgentMetadata {
  id: AgentId;
  name: string;
  category: AgentCategory;
  tagline: string;
  description: string;
  icon: string;
  safetyPolicies: string[];
  allowedOperations: string[];
  prohibitedOperations: string[];
  defaultPayload: Record<string, unknown>;
  presetExamples: Array<{
    title: string;
    description: string;
    payload: Record<string, unknown>;
  }>;
}

export interface AgentExecutionRequest {
  agentId: AgentId;
  action?: string;
  payload: Record<string, unknown>;
  dryRun?: boolean;
  useAi?: boolean;
}

export interface AgentExecutionResponse<T = unknown> {
  success: boolean;
  agentId: AgentId;
  timestamp: string;
  executionTimeMs: number;
  safety: SafetyCheckResult;
  data: T;
  aiExplanation?: string;
  recommendations?: string[];
  error?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentId: AgentId;
  action: string;
  status: 'SUCCESS' | 'BLOCKED' | 'WARNING' | 'ERROR';
  threatScore: number;
  executionTimeMs: number;
  clientIp?: string;
  summary: string;
  details?: Record<string, unknown>;
}

// 1. System Monitor Types
export interface SystemMetrics {
  timestamp: string;
  uptimeSeconds: number;
  cpu: {
    cores: number;
    usagePercent: number;
    loadAverage: [number, number, number];
    processCpuPercent: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
    processHeapUsedBytes: number;
    processHeapTotalBytes: number;
    processRssBytes: number;
  };
  disk: {
    virtualMount: string;
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercent: number;
  };
  eventLoop: {
    latencyMs: number;
    status: 'HEALTHY' | 'ELEVATED' | 'DEGRADED';
  };
  network: {
    activeConnections: number;
    bytesIn: number;
    bytesOut: number;
  };
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  activeAlerts: Array<{
    id: string;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    metric: string;
    message: string;
  }>;
}

// 2. Log Analyzer Types
export interface LogAnalysisResult {
  totalLogsParsed: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  securityThreatsFound: Array<{
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'SQL_INJECTION' | 'XSS' | 'BRUTE_FORCE' | 'UNAUTHORIZED_ACCESS' | 'PATH_TRAVERSAL' | 'SENSITIVE_DATA_LEAK';
    rawSnippet: string;
    explanation: string;
  }>;
  anomaliesDetected: Array<{
    pattern: string;
    occurrences: number;
    firstSeen: string;
    lastSeen: string;
  }>;
  scrubbedLogSample: string;
  sanitizedPiiCount: number;
  rootCauseAnalysis?: string;
}

// 3. Process Manager Types
export interface ProcessInfo {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryUsageMb: number;
  status: 'RUNNING' | 'SLEEPING' | 'IDLE' | 'ZOMBIE' | 'LOCKED';
  isProtected: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  threatRiskScore: number;
  command: string;
  startTime: string;
}

export interface ProcessManagerResult {
  processes: ProcessInfo[];
  totalProcesses: number;
  highRiskCount: number;
  zombieCount: number;
  resourceHogCount: number;
  actionTaken?: {
    signal: string;
    targetPid: number;
    result: 'SIMULATED_SUCCESS' | 'DENIED_PROTECTED_PROCESS' | 'EXECUTED_SAFE_TERMINATION';
    message: string;
  };
  suggestions: string[];
}

// 4. File Analyzer Types
export interface FileAnalysisResult {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sha256Hash: string;
  entropyScore: number; // 0-8 (values > 7.5 indicate encryption/ransomware/packing)
  entropyRating: 'NORMAL_TEXT' | 'STRUCTURED_BINARY' | 'HIGH_COMPRESSION' | 'SUSPICIOUS_ENCRYPTED';
  dangerousExtensionsDetected: boolean;
  sensitivePatternsFound: Array<{
    type: 'AWS_KEY' | 'PRIVATE_KEY' | 'API_TOKEN' | 'PASSWORD' | 'ENV_FILE';
    line?: number;
    preview: string;
  }>;
  syntaxCheck?: {
    valid: boolean;
    language: string;
    error?: string;
  };
  isSafeForIngestion: boolean;
}

// 5. Code Assistant Types
export interface CodeAnalysisResult {
  language: string;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  loc: number;
  securityVulnerabilities: Array<{
    ruleId: string;
    cwe?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    line: number;
    title: string;
    description: string;
    remediation: string;
  }>;
  codeSmells: Array<{
    type: string;
    line: number;
    suggestion: string;
  }>;
  optimizedCodeSnippet?: string;
  generatedUnitTests?: string;
  aiExplanation?: string;
}

// 6. Database Query Types
export interface DatabaseQueryResult {
  query: string;
  normalizedQuery: string;
  isSafe: boolean;
  injectionThreatsDetected: string[];
  executionPlan: Array<{
    step: number;
    operation: string;
    estimatedCost: string;
    indexUsed: string | null;
  }>;
  rowsAffected: number;
  executionTimeMs: number;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  dryRunMode: boolean;
  schemaDetails?: {
    tableName: string;
    columns: Array<{ name: string; type: string; isPrimary: boolean; isIndexed: boolean }>;
  };
}

// 7. Data Transformer Types
export interface DataTransformerResult {
  inputFormat: 'JSON' | 'CSV' | 'YAML' | 'XML' | 'TOML' | 'MARKDOWN' | 'NDJSON';
  outputFormat: 'JSON' | 'CSV' | 'YAML' | 'XML' | 'TOML' | 'MARKDOWN' | 'NDJSON';
  recordCount: number;
  transformedOutput: string;
  inferredSchema: Record<string, string>;
  validationErrors: string[];
  dataMaskingApplied: boolean;
  compressionRatio?: string;
}

// 8. Content Analyzer Types
export interface ContentAnalysisResult {
  characterCount: number;
  wordCount: number;
  readingTimeMinutes: number;
  readabilityScores: {
    fleschKincaidGrade: number;
    fleschReadingEase: number;
    interpretation: string;
  };
  sentiment: {
    score: number; // -1 to +1
    label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    confidence: number;
  };
  toxicityScore: number; // 0-100
  piiEntities: Array<{
    type: 'EMAIL' | 'PHONE' | 'SSN' | 'CREDIT_CARD' | 'IP_ADDRESS' | 'JWT';
    count: number;
    maskedPreview: string;
  }>;
  complianceFlags: Array<{
    standard: 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'CONTENT_SAFETY';
    status: 'PASS' | 'WARNING' | 'FAIL';
    detail: string;
  }>;
  sanitizedContent: string;
  keyPhrases: string[];
}

// 9. Regex Tester Types
export interface RegexTestResult {
  pattern: string;
  flags: string;
  isValid: boolean;
  syntaxError?: string;
  redosAnalysis: {
    isVulnerableToRedos: boolean;
    vulnerabilityLevel: 'SAFE' | 'LOW_RISK' | 'HIGH_RISK_CATASTROPHIC';
    catastrophicReason?: string;
    stepCount: number;
  };
  matches: Array<{
    index: number;
    matchedText: string;
    groups: Record<string, string>;
    captureGroups: string[];
  }>;
  explanation: Array<{
    token: string;
    meaning: string;
  }>;
  syntheticTestCases: Array<{
    input: string;
    expectedMatch: boolean;
    description: string;
  }>;
}

// 10. System Optimizer Types
export interface SystemOptimizationResult {
  targetSystem: string;
  currentScore: number; // 0-100
  potentialScore: number; // 0-100
  riskRating: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  bottlenecksIdentified: Array<{
    category: 'MEMORY' | 'CPU' | 'I/O' | 'NETWORK' | 'DATABASE' | 'CACHE';
    issue: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    category: string;
    currentConfig: string;
    recommendedConfig: string;
    estimatedImprovement: string;
    risk: 'SAFE_AUTO_APPLY' | 'REQUIRES_RESTART' | 'BENCHMARK_FIRST';
  }>;
  diffPatch: string;
  rollbackPlan: string;
  simulatedBenchmark: {
    beforeRps: number;
    afterRps: number;
    beforeLatencyP99Ms: number;
    afterLatencyP99Ms: number;
    memorySavedMb: number;
  };
}
