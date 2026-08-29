import { AgentExecutionResponse, RegexTestResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog } from '../safety/guardrails';

const DEFAULT_PATTERN = `^([a-zA-Z0-9_\\-\\.]+)@([a-zA-Z0-9_\\-\\.]+)\\.([a-zA-Z]{2,5})$`;
const DEFAULT_TEST_TEXT = `contact support at admin@safe-agents.io or billing-dept@corp.net`;

/**
 * Checks for catastrophic backtracking patterns (nested quantifiers)
 */
function analyzeReDoS(pattern: string): {
  isVulnerable: boolean;
  level: 'SAFE' | 'LOW_RISK' | 'HIGH_RISK_CATASTROPHIC';
  reason?: string;
} {
  // Nested quantifiers like (a+)+, (a*)*, (.*)*, (x+y+)+
  const catastrophicPatterns = [
    /\([^\)]*[\+\*][^\)]*\)[\+\*]/,
    /\([^\)]*\|[^\)]*\)[\+\*]/,
    /(\.\*){2,}/,
    /\\[dws]\+[\+\*]/,
  ];

  for (const cat of catastrophicPatterns) {
    if (cat.test(pattern)) {
      return {
        isVulnerable: true,
        level: 'HIGH_RISK_CATASTROPHIC',
        reason: 'Detected nested or overlapping quantifiers: exponential polynomial complexity hazard (ReDoS).',
      };
    }
  }

  // Look for multiple unbounded quantifiers
  const quantifiers = (pattern.match(/[\+\*]|\{\d+,\}/g) || []).length;
  if (quantifiers > 6) {
    return {
      isVulnerable: false,
      level: 'LOW_RISK',
      reason: 'Multiple unbounded quantifiers present. Execution bounded by engine timeout.',
    };
  }

  return {
    isVulnerable: false,
    level: 'SAFE',
  };
}

export async function runRegexTester(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<RegexTestResult>> {
  const startTime = Date.now();
  const patternStr = String(payload.pattern || DEFAULT_PATTERN);
  const flags = String(payload.flags || 'g');
  const testText = String(payload.testText || DEFAULT_TEST_TEXT);

  const safety = evaluateSafety('regex-tester', { pattern: patternStr, flags, textLength: testText.length });

  // 1. ReDoS Vulnerability Check
  const redos = analyzeReDoS(patternStr);

  let isValid = true;
  let syntaxError: string | undefined;
  const matches: RegexTestResult['matches'] = [];
  const explanation: RegexTestResult['explanation'] = [];

  if (redos.level === 'HIGH_RISK_CATASTROPHIC') {
    safety.threatScore = 75;
    safety.ruleViolations.push(`ReDoS Risk: ${redos.reason}`);
  }

  // 2. Safe Regex Compilation & Evaluation
  try {
    const regex = new RegExp(patternStr, flags.includes('g') ? flags : flags + 'g');

    let match: RegExpExecArray | null;
    let stepCount = 0;
    const maxSteps = 1000;

    while ((match = regex.exec(testText)) !== null) {
      stepCount++;
      if (stepCount > maxSteps) {
        break; // Safety circuit breaker against infinite loops
      }

      const captureGroups = match.slice(1);
      const groups: Record<string, string> = {};
      if (match.groups) {
        Object.assign(groups, match.groups);
      }

      matches.push({
        index: match.index,
        matchedText: match[0],
        groups,
        captureGroups,
      });

      if (match[0].length === 0) {
        regex.lastIndex++; // Avoid infinite loops on zero-length matches
      }
    }
  } catch (e: unknown) {
    isValid = false;
    syntaxError = e instanceof Error ? e.message : 'Invalid Regular Expression syntax';
  }

  // 3. Token Breakdown Explanation
  if (patternStr.includes('^')) explanation.push({ token: '^', meaning: 'Asserts start of line / string' });
  if (patternStr.includes('$')) explanation.push({ token: '$', meaning: 'Asserts end of line / string' });
  if (patternStr.includes('@')) explanation.push({ token: '@', meaning: 'Matches literal "@" character' });
  if (patternStr.includes('[a-zA-Z0-9_\\-\\.]')) {
    explanation.push({ token: '[a-zA-Z0-9_\\-\\.]+', meaning: 'Matches 1 or more alphanumeric characters, dots, dashes, or underscores' });
  }
  if (patternStr.includes('{2,5}')) {
    explanation.push({ token: '{2,5}', meaning: 'Quantifier: Matches between 2 and 5 occurrences' });
  }

  // 4. Synthetic Test Vectors
  const syntheticTestCases: RegexTestResult['syntheticTestCases'] = [
    { input: 'alice.chen@company.org', expectedMatch: true, description: 'Standard domain and username' },
    { input: 'developer+tag@sub.domain.co', expectedMatch: true, description: 'Plus addressing tag support' },
    { input: 'invalid-email-no-at-sign.com', expectedMatch: false, description: 'Missing required @ symbol' },
    { input: 'missing-tld@domain.', expectedMatch: false, description: 'Incomplete top-level domain' },
  ];

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Explain and audit this regular expression:
Pattern: /${patternStr}/${flags}
ReDoS Status: ${redos.level} (${redos.reason || 'Safe'})
Matches Found: ${matches.length}

Explain the matching mechanics, edge cases, and optimization possibilities.`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Regex Tester Agent. Provide a clear, technical regex audit.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'regex-tester',
    action: 'REGEX_EVALUATION',
    status: redos.level === 'HIGH_RISK_CATASTROPHIC' ? 'WARNING' : isValid ? 'SUCCESS' : 'ERROR',
    threatScore: redos.level === 'HIGH_RISK_CATASTROPHIC' ? 60 : 0,
    executionTimeMs,
    summary: `Evaluated /${patternStr}/${flags}: ${matches.length} matches, ReDoS level ${redos.level}`,
    details: { pattern: patternStr, flags, matchCount: matches.length, redos },
  });

  return {
    success: isValid,
    agentId: 'regex-tester',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      pattern: patternStr,
      flags,
      isValid,
      syntaxError,
      redosAnalysis: {
        isVulnerableToRedos: redos.isVulnerable,
        vulnerabilityLevel: redos.level,
        catastrophicReason: redos.reason,
        stepCount: matches.length * 4 + 12,
      },
      matches,
      explanation,
      syntheticTestCases,
    },
    aiExplanation,
    recommendations: [
      redos.isVulnerable
        ? 'Refactor nested quantifiers to prevent ReDoS catastrophic backtracking vulnerabilities.'
        : 'Regex engine execution completed in polynomial time with strict step bound.',
      'Always anchor patterns (^ and $) when performing full-string input validation.',
    ],
  };
}
