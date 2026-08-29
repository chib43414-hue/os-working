import crypto from 'crypto';
import { AgentExecutionResponse, FileAnalysisResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog } from '../safety/guardrails';

/**
 * Calculates Shannon Entropy of a string/buffer (0 to 8)
 */
function calculateShannonEntropy(data: string): number {
  if (!data || data.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  const len = data.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }

  return Math.round(entropy * 100) / 100;
}

const DEFAULT_SAMPLE_CODE = `# Production Configuration File
DATABASE_URL="postgres://app_user:s3cr3t_p@ssw0rd@db.internal:5432/production_db"
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
NODE_ENV="production"
PORT=3000
JWT_SECRET="super-secret-jwt-signing-key-991241"
`;

export async function runFileAnalyzer(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<FileAnalysisResult>> {
  const startTime = Date.now();
  const fileName = String(payload.fileName || 'config.env');
  const fileContent = String(payload.content !== undefined ? payload.content : DEFAULT_SAMPLE_CODE);

  const safety = evaluateSafety('file-analyzer', { fileName, contentLength: fileContent.length });

  // Calculate SHA-256
  const sha256Hash = crypto.createHash('sha256').update(fileContent).digest('hex');
  const fileSizeBytes = Buffer.byteLength(fileContent, 'utf8');

  // Calculate Shannon Entropy
  const entropyScore = calculateShannonEntropy(fileContent);
  let entropyRating: FileAnalysisResult['entropyRating'] = 'NORMAL_TEXT';
  if (entropyScore > 7.5) {
    entropyRating = 'SUSPICIOUS_ENCRYPTED';
  } else if (entropyScore > 6.0) {
    entropyRating = 'HIGH_COMPRESSION';
  } else if (entropyScore > 4.5) {
    entropyRating = 'STRUCTURED_BINARY';
  }

  // Dangerous extension check
  const dangerousExtensionsDetected = /\.(exe|bat|cmd|vbs|scr|pif|hta|dll|so|dylib)$/i.test(fileName);

  // Sensitive patterns search
  const sensitivePatternsFound: FileAnalysisResult['sensitivePatternsFound'] = [];
  const lines = fileContent.split('\n');

  lines.forEach((line, idx) => {
    if (/(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/.test(line)) {
      sensitivePatternsFound.push({
        type: 'AWS_KEY',
        line: idx + 1,
        preview: line.slice(0, 80).replace(/[0-9A-Z]{12}$/, '************'),
      });
    }
    if (/-----BEGIN (RSA|OPENSSH|EC|DSA|PGP)? PRIVATE KEY-----/.test(line)) {
      sensitivePatternsFound.push({
        type: 'PRIVATE_KEY',
        line: idx + 1,
        preview: '-----BEGIN PRIVATE KEY----- [REDACTED]',
      });
    }
    if (/(?:password|passwd|pwd|secret|api_key)\s*[:=]\s*['"]?[^\s'"]{4,}/i.test(line)) {
      sensitivePatternsFound.push({
        type: 'PASSWORD',
        line: idx + 1,
        preview: line.replace(/[:=]\s*['"]?[^\s'"]+/i, '= "[REDACTED]"'),
      });
    }
  });

  // Syntax validation
  let syntaxCheck: FileAnalysisResult['syntaxCheck'] = { valid: true, language: 'Plaintext/Config' };
  if (fileName.endsWith('.json')) {
    syntaxCheck.language = 'JSON';
    try {
      JSON.parse(fileContent);
      syntaxCheck.valid = true;
    } catch (e: unknown) {
      syntaxCheck.valid = false;
      syntaxCheck.error = e instanceof Error ? e.message : 'Invalid JSON format';
    }
  }

  const isSafeForIngestion =
    !dangerousExtensionsDetected &&
    entropyRating !== 'SUSPICIOUS_ENCRYPTED' &&
    sensitivePatternsFound.length === 0;

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Perform a static security and integrity review of file "${fileName}":
- Size: ${fileSizeBytes} bytes
- SHA-256: ${sha256Hash}
- Shannon Entropy: ${entropyScore} (${entropyRating})
- Secrets Found: ${sensitivePatternsFound.length} items
- Preview: ${fileContent.slice(0, 1000)}`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe File Analyzer Agent. Provide an actionable file security appraisal.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'file-analyzer',
    action: 'STATIC_FILE_INSPECTION',
    status: isSafeForIngestion ? 'SUCCESS' : 'WARNING',
    threatScore: sensitivePatternsFound.length > 0 ? 50 : dangerousExtensionsDetected ? 80 : 0,
    executionTimeMs,
    summary: `Analyzed ${fileName} (${fileSizeBytes} B): Entropy ${entropyScore}, ${sensitivePatternsFound.length} secrets found. Safe: ${isSafeForIngestion}`,
    details: { fileName, fileSizeBytes, entropyScore, isSafeForIngestion },
  });

  return {
    success: true,
    agentId: 'file-analyzer',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      fileName,
      fileSizeBytes,
      mimeType: fileName.endsWith('.json') ? 'application/json' : 'text/plain',
      sha256Hash,
      entropyScore,
      entropyRating,
      dangerousExtensionsDetected,
      sensitivePatternsFound,
      syntaxCheck,
      isSafeForIngestion,
    },
    aiExplanation,
    recommendations: [
      sensitivePatternsFound.length > 0
        ? 'CRITICAL: Remove hardcoded credentials and store in Secret Manager or .env.local (git-ignored).'
        : 'File content verified free of embedded secrets.',
      entropyScore > 7.5
        ? 'High entropy indicates encryption or binary payload. Sandbox scan before execution.'
        : 'File entropy is within standard alphanumeric distribution.',
    ],
  };
}
