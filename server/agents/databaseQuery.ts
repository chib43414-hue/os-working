import { AgentExecutionResponse, DatabaseQueryResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog } from '../safety/guardrails';

// In-memory relational sample dataset
interface UserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface OrderRecord {
  id: number;
  user_id: number;
  amount: number;
  status: string;
  created_at: string;
}

const SEEDED_USERS: UserRecord[] = [
  { id: 1, name: 'Alice Chen', email: 'alice@corp.io', role: 'admin', status: 'active', created_at: '2026-01-15' },
  { id: 2, name: 'Bob Smith', email: 'bob@corp.io', role: 'developer', status: 'active', created_at: '2026-02-01' },
  { id: 3, name: 'Carol Danvers', email: 'carol@corp.io', role: 'analyst', status: 'active', created_at: '2026-02-14' },
  { id: 4, name: 'David Miller', email: 'david@corp.io', role: 'developer', status: 'suspended', created_at: '2026-03-01' },
  { id: 5, name: 'Eva Green', email: 'eva@corp.io', role: 'viewer', status: 'active', created_at: '2026-03-20' },
];

const SEEDED_ORDERS: OrderRecord[] = [
  { id: 101, user_id: 1, amount: 249.99, status: 'COMPLETED', created_at: '2026-08-01' },
  { id: 102, user_id: 2, amount: 89.5, status: 'COMPLETED', created_at: '2026-08-05' },
  { id: 103, user_id: 1, amount: 1200.0, status: 'PENDING', created_at: '2026-08-10' },
  { id: 104, user_id: 3, amount: 45.0, status: 'COMPLETED', created_at: '2026-08-15' },
  { id: 105, user_id: 4, amount: 650.0, status: 'REFUNDED', created_at: '2026-08-20' },
];

const DEFAULT_QUERY = `SELECT id, name, email, role, status FROM users WHERE status = 'active' ORDER BY id ASC LIMIT 5;`;

export async function runDatabaseQuery(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<DatabaseQueryResult>> {
  const startTime = Date.now();
  const rawQuery = String(payload.query || DEFAULT_QUERY).trim();
  const dryRun = payload.dryRun !== false;

  const safety = evaluateSafety('database-query', { query: rawQuery, dryRun });

  const injectionThreatsDetected: string[] = [];

  // SQL Injection & Destructive Mutation Firewall
  if (/DROP\s+(DATABASE|TABLE|SCHEMA)/i.test(rawQuery)) {
    injectionThreatsDetected.push('BLOCKED: DROP command violates immutable schema policy.');
  }
  if (/TRUNCATE\s+TABLE/i.test(rawQuery)) {
    injectionThreatsDetected.push('BLOCKED: TRUNCATE command blocked by safety firewall.');
  }
  if (/UNION\s+SELECT/i.test(rawQuery)) {
    injectionThreatsDetected.push('BLOCKED: UNION SELECT probe (potential unauthorized table exfiltration).');
  }
  if (/--|\/\*|\*\/|;\s*SELECT|;\s*DROP|;\s*DELETE/i.test(rawQuery)) {
    injectionThreatsDetected.push('BLOCKED: Stacked query or SQL comment obfuscation signature.');
  }
  if (/pg_sleep|benchmark\(|waitfor\s+delay/i.test(rawQuery)) {
    injectionThreatsDetected.push('BLOCKED: Time-based blind SQL injection vector.');
  }

  const isSafe = injectionThreatsDetected.length === 0;

  // Safe Sandboxed Query Execution
  let columns: string[] = [];
  let rows: Array<Record<string, unknown>> = [];
  let rowsAffected = 0;

  const executionPlan = [
    {
      step: 1,
      operation: 'PARSE & VALIDATE AST',
      estimatedCost: '0.02 ms',
      indexUsed: 'Safety Tokenizer',
    },
    {
      step: 2,
      operation: 'INDEX SCAN (idx_users_status)',
      estimatedCost: '0.15 ms',
      indexUsed: 'idx_users_status',
    },
    {
      step: 3,
      operation: 'MEMORY PROJECTION & LIMIT 5',
      estimatedCost: '0.04 ms',
      indexUsed: null,
    },
  ];

  if (isSafe) {
    const lower = rawQuery.toLowerCase();
    if (lower.includes('from users')) {
      columns = ['id', 'name', 'email', 'role', 'status', 'created_at'];
      let filtered = [...SEEDED_USERS];
      if (lower.includes("status = 'active'")) {
        filtered = filtered.filter((u) => u.status === 'active');
      } else if (lower.includes("role = 'admin'")) {
        filtered = filtered.filter((u) => u.role === 'admin');
      }
      rows = filtered.slice(0, 5) as unknown as Array<Record<string, unknown>>;
      rowsAffected = rows.length;
    } else if (lower.includes('from orders')) {
      columns = ['id', 'user_id', 'amount', 'status', 'created_at'];
      rows = SEEDED_ORDERS.slice(0, 5) as unknown as Array<Record<string, unknown>>;
      rowsAffected = rows.length;
    } else {
      // Default virtual result
      columns = ['id', 'metric', 'value', 'timestamp'];
      rows = [
        { id: 1, metric: 'active_sessions', value: 42, timestamp: new Date().toISOString() },
        { id: 2, metric: 'query_cache_hit_ratio', value: '98.4%', timestamp: new Date().toISOString() },
      ];
      rowsAffected = rows.length;
    }
  }

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Review this SQL query execution:
Query: ${rawQuery}
Is Safe: ${isSafe}
Injection Threats: ${injectionThreatsDetected.join(', ') || 'None'}
Dry Run Mode: ${dryRun}

Provide query plan optimization insights and security commentary.`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Database Query Agent. Explain SQL execution plans and safety bounds.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'database-query',
    action: isSafe ? 'SAFE_QUERY_EXECUTION' : 'SQL_FIREWALL_BLOCK',
    status: isSafe ? 'SUCCESS' : 'BLOCKED',
    threatScore: isSafe ? 0 : 85,
    executionTimeMs,
    summary: isSafe
      ? `Executed query: returned ${rowsAffected} rows in ${executionTimeMs}ms (DryRun: ${dryRun})`
      : `Blocked query due to ${injectionThreatsDetected.length} SQL firewall threat(s)`,
    details: { query: rawQuery, isSafe, rowsAffected, threats: injectionThreatsDetected },
  });

  return {
    success: isSafe,
    agentId: 'database-query',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      query: rawQuery,
      normalizedQuery: rawQuery.replace(/\s+/g, ' '),
      isSafe,
      injectionThreatsDetected,
      executionPlan,
      rowsAffected,
      executionTimeMs,
      columns,
      rows,
      dryRunMode: dryRun,
      schemaDetails: {
        tableName: 'users',
        columns: [
          { name: 'id', type: 'INTEGER', isPrimary: true, isIndexed: true },
          { name: 'name', type: 'VARCHAR(255)', isPrimary: false, isIndexed: false },
          { name: 'email', type: 'VARCHAR(255)', isPrimary: false, isIndexed: true },
          { name: 'role', type: 'VARCHAR(50)', isPrimary: false, isIndexed: true },
          { name: 'status', type: 'VARCHAR(50)', isPrimary: false, isIndexed: true },
        ],
      },
    },
    aiExplanation,
    recommendations: [
      'Always utilize parameterized statements ($1, $2) rather than string concatenation.',
      'Maintain an index on high-cardinality search columns (`users.status`, `orders.created_at`).',
      'Read-only sandbox guarantees zero mutation risk during analytical exploratory queries.',
    ],
  };
}
