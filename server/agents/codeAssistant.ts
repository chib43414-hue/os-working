import { AgentExecutionResponse, CodeAnalysisResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog } from '../safety/guardrails';

const DEFAULT_SAMPLE_CODE = `// User Authentication Controller
import express from 'express';
import { exec } from 'child_process';

const router = express.Router();

router.post('/lookup-user', (req, res) => {
  const username = req.body.username;

  // Vulnerability: Command Injection & eval
  const cmd = "cat /var/data/users/" + username + ".json";
  exec(cmd, (err, stdout) => {
    if (err) return res.status(500).json({ error: err.message });

    // Insecure parsing
    const userObj = eval("(" + stdout + ")");
    res.json({ user: userObj });
  });
});

export default router;`;

export async function runCodeAssistant(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<CodeAnalysisResult>> {
  const startTime = Date.now();
  const code = String(payload.code || DEFAULT_SAMPLE_CODE);
  const language = String(payload.language || 'typescript');

  const safety = evaluateSafety('code-assistant', { codeLength: code.length, language });

  const lines = code.split('\n');
  const loc = lines.length;

  // Calculate approximate Cyclomatic Complexity
  let cyclomaticComplexity = 1;
  const decisionPatterns = [/\bif\b/, /\belse\s+if\b/, /\bfor\b/, /\bwhile\b/, /\bcase\b/, /\bcatch\b/, /&&/, /\|\|/, /\?/];
  lines.forEach((line) => {
    decisionPatterns.forEach((p) => {
      if (p.test(line)) cyclomaticComplexity++;
    });
  });

  const cognitiveComplexity = Math.max(1, Math.round(cyclomaticComplexity * 0.8));

  // Static Security Vulnerability Scanner
  const securityVulnerabilities: CodeAnalysisResult['securityVulnerabilities'] = [];
  const codeSmells: CodeAnalysisResult['codeSmells'] = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Command Injection Check
    if (/child_process|exec\(|spawn\(|execSync\(/i.test(line)) {
      securityVulnerabilities.push({
        ruleId: 'SEC-CMD-INJECTION',
        cwe: 'CWE-78',
        severity: 'CRITICAL',
        line: lineNum,
        title: 'Unsanitized Command Execution (CWE-78)',
        description: 'Direct invocation of child_process.exec() with string concatenation allows arbitrary shell command execution.',
        remediation: 'Use filesystem APIs (fs.promises.readFile) with validated path parameters instead of shell execution.',
      });
    }

    // Insecure Eval
    if (/\beval\s*\(|new\s+Function\s*\(/i.test(line)) {
      securityVulnerabilities.push({
        ruleId: 'SEC-INSECURE-EVAL',
        cwe: 'CWE-95',
        severity: 'HIGH',
        line: lineNum,
        title: 'Dangerous eval() Execution (CWE-95)',
        description: 'Executing untrusted text with eval() exposes the runtime to remote code execution.',
        remediation: 'Replace eval() with standard JSON.parse() and strict schema validation.',
      });
    }

    // Hardcoded Secret
    if (/(?:secret|password|api_key)\s*=\s*['"][a-zA-Z0-9_\-]{8,}['"]/i.test(line)) {
      securityVulnerabilities.push({
        ruleId: 'SEC-HARDCODED-SECRET',
        cwe: 'CWE-798',
        severity: 'HIGH',
        line: lineNum,
        title: 'Hardcoded Secret Detected',
        description: 'Cryptographic credentials or tokens should not be hardcoded in source repository files.',
        remediation: 'Load secrets dynamically from process.env with fallback assertions.',
      });
    }

    // Code Smells
    if (/\bvar\b/.test(line)) {
      codeSmells.push({
        type: 'Legacy var declaration',
        line: lineNum,
        suggestion: 'Replace "var" with "const" or "let" to avoid variable hoisting quirks.',
      });
    }
  });

  const optimizedCodeSnippet = `// Remediated & Hardened Controller
import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const DATA_DIR = path.resolve('/var/data/users');

router.post('/lookup-user', async (req, res) => {
  try {
    const { username } = req.body;

    // Safety: Validate alphanumeric input & prevent path traversal
    if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }

    const safePath = path.join(DATA_DIR, \`\${username}.json\`);
    if (!safePath.startsWith(DATA_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const content = await fs.readFile(safePath, 'utf-8');
    const userObj = JSON.parse(content);

    return res.json({ user: userObj });
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;`;

  const generatedUnitTests = `import request from 'supertest';
import express from 'express';
import userRouter from './userRouter';

describe('Safe User Lookup API', () => {
  const app = express();
  app.use(express.json());
  app.use(userRouter);

  it('should reject path traversal payload with HTTP 400', async () => {
    const res = await request(app)
      .post('/lookup-user')
      .send({ username: '../../etc/passwd' });
    expect(res.status).toBe(400);
  });

  it('should reject shell injection characters with HTTP 400', async () => {
    const res = await request(app)
      .post('/lookup-user')
      .send({ username: 'admin; rm -rf /' });
    expect(res.status).toBe(400);
  });
});`;

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Review the following code snippet for safety, performance, and best practices:
Language: ${language}
LOC: ${loc}
Vulnerabilities Found: ${securityVulnerabilities.length}

Code:
${code.slice(0, 2500)}`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Code Assistant Agent. Provide a structured code review emphasizing security hardening.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'code-assistant',
    action: 'STATIC_CODE_REVIEW',
    status: securityVulnerabilities.length > 0 ? 'WARNING' : 'SUCCESS',
    threatScore: securityVulnerabilities.length * 30,
    executionTimeMs,
    summary: `Reviewed ${loc} lines of ${language} code: Found ${securityVulnerabilities.length} vulnerabilities and ${codeSmells.length} smells. Complexity: ${cyclomaticComplexity}`,
    details: { loc, vulnerabilitiesCount: securityVulnerabilities.length, cyclomaticComplexity },
  });

  return {
    success: true,
    agentId: 'code-assistant',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      language,
      cyclomaticComplexity,
      cognitiveComplexity,
      loc,
      securityVulnerabilities,
      codeSmells,
      optimizedCodeSnippet,
      generatedUnitTests,
    },
    aiExplanation,
    recommendations: [
      'Eliminate all dynamic shell execution; use direct asynchronous file or database drivers.',
      'Enforce input validation using strict allowlists (e.g. Zod or Regex).',
      'Replace eval() with JSON.parse() and safe deserializers.',
    ],
  };
}
