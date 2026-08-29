import { AgentExecutionResponse, DataTransformerResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog, scrubPii } from '../safety/guardrails';

const DEFAULT_JSON_INPUT = JSON.stringify(
  [
    { id: 101, name: 'Alice Chen', email: 'alice@example.com', department: 'Engineering', salary: 145000, active: true },
    { id: 102, name: 'Bob Smith', email: 'bob@example.com', department: 'Product', salary: 130000, active: true },
    { id: 103, name: 'Carol Danvers', email: 'carol@example.com', department: 'Security', salary: 155000, active: false },
  ],
  null,
  2
);

export async function runDataTransformer(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<DataTransformerResult>> {
  const startTime = Date.now();
  const rawInput = String(payload.input || DEFAULT_JSON_INPUT);
  const inputFormat = String(payload.inputFormat || 'JSON').toUpperCase() as DataTransformerResult['inputFormat'];
  const outputFormat = String(payload.outputFormat || 'CSV').toUpperCase() as DataTransformerResult['outputFormat'];
  const maskPii = payload.maskPii !== false;

  const safety = evaluateSafety('data-transformer', { inputLength: rawInput.length, inputFormat, outputFormat });

  const validationErrors: string[] = [];
  let parsedRecords: Array<Record<string, unknown>> = [];

  // Parse input format safely
  try {
    if (inputFormat === 'JSON') {
      const parsed = JSON.parse(rawInput);
      parsedRecords = Array.isArray(parsed) ? parsed : [parsed];
    } else if (inputFormat === 'CSV') {
      const lines = rawInput.trim().split('\n');
      if (lines.length > 0) {
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
        parsedRecords = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i] ?? '';
          });
          return obj;
        });
      }
    } else {
      parsedRecords = [{ rawData: rawInput }];
    }
  } catch (e: unknown) {
    validationErrors.push(`Failed to parse input ${inputFormat}: ${e instanceof Error ? e.message : 'Syntax error'}`);
    parsedRecords = [];
  }

  // Infer Schema
  const inferredSchema: Record<string, string> = {};
  if (parsedRecords.length > 0) {
    const sample = parsedRecords[0];
    for (const key of Object.keys(sample)) {
      const val = sample[key];
      inferredSchema[key] = typeof val;
    }
  }

  // Mask PII if requested
  let dataMaskingApplied = false;
  if (maskPii && parsedRecords.length > 0) {
    parsedRecords = parsedRecords.map((item) => {
      const copy = { ...item };
      for (const [k, v] of Object.entries(copy)) {
        if (typeof v === 'string') {
          const { sanitized, count } = scrubPii(v);
          if (count > 0) {
            copy[k] = sanitized;
            dataMaskingApplied = true;
          }
        }
      }
      return copy;
    });
  }

  // Transform to Output Format
  let transformedOutput = '';
  if (parsedRecords.length === 0) {
    transformedOutput = validationErrors.join('\n');
  } else if (outputFormat === 'CSV') {
    const headers = Object.keys(parsedRecords[0]);
    const csvRows = [headers.join(',')];
    for (const row of parsedRecords) {
      csvRows.push(headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
    }
    transformedOutput = csvRows.join('\n');
  } else if (outputFormat === 'MARKDOWN') {
    const headers = Object.keys(parsedRecords[0]);
    const mdHeader = `| ${headers.join(' | ')} |`;
    const mdSeparator = `| ${headers.map(() => '---').join(' | ')} |`;
    const mdRows = parsedRecords.map((row) => `| ${headers.map((h) => String(row[h] ?? '')).join(' | ')} |`);
    transformedOutput = [mdHeader, mdSeparator, ...mdRows].join('\n');
  } else if (outputFormat === 'YAML') {
    transformedOutput = parsedRecords
      .map((item) => {
        return (
          '- ' +
          Object.entries(item)
            .map(([k, v], i) => (i === 0 ? `${k}: ${v}` : `  ${k}: ${v}`))
            .join('\n')
        );
      })
      .join('\n');
  } else if (outputFormat === 'NDJSON') {
    transformedOutput = parsedRecords.map((r) => JSON.stringify(r)).join('\n');
  } else if (outputFormat === 'XML') {
    transformedOutput = `<records>\n${parsedRecords
      .map(
        (r) =>
          `  <record>\n${Object.entries(r)
            .map(([k, v]) => `    <${k}>${String(v)}</${k}>`)
            .join('\n')}\n  </record>`
      )
      .join('\n')}\n</records>`;
  } else {
    transformedOutput = JSON.stringify(parsedRecords, null, 2);
  }

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Explain this data transformation pipeline:
- Input Format: ${inputFormat} (${parsedRecords.length} records)
- Output Format: ${outputFormat}
- Inferred Schema: ${JSON.stringify(inferredSchema)}
- Mask PII: ${maskPii} (Applied: ${dataMaskingApplied})

Output Sample:
${transformedOutput.slice(0, 1000)}`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Data Transformer Agent. Explain data schema mappings and sanitization steps.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'data-transformer',
    action: `CONVERT_${inputFormat}_TO_${outputFormat}`,
    status: validationErrors.length > 0 ? 'WARNING' : 'SUCCESS',
    threatScore: 0,
    executionTimeMs,
    summary: `Transformed ${parsedRecords.length} records from ${inputFormat} to ${outputFormat}. PII Masked: ${dataMaskingApplied}`,
    details: { inputFormat, outputFormat, recordCount: parsedRecords.length },
  });

  return {
    success: validationErrors.length === 0,
    agentId: 'data-transformer',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      inputFormat,
      outputFormat,
      recordCount: parsedRecords.length,
      transformedOutput,
      inferredSchema,
      validationErrors,
      dataMaskingApplied,
      compressionRatio: `${Math.round((transformedOutput.length / (rawInput.length || 1)) * 100)}%`,
    },
    aiExplanation,
  };
}
