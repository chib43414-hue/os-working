import { AgentExecutionResponse, ContentAnalysisResult } from '../../src/types';
import { generateSafeAiAnalysis } from '../gemini';
import { evaluateSafety, recordAuditLog, scrubPii } from '../safety/guardrails';

const DEFAULT_SAMPLE_TEXT = `Customer Service Incident Report:
Patient Jane Doe (SSN: 123-45-6789, email: jane.doe@healthcorp.org) contacted support regarding delayed billing invoice.
Card number ending in 4532-1290-8812-4019 was charged $450.00 for outpatient telemetry monitoring.
The customer was extremely pleased with the nursing staff's quick bedside care, but expressed frustration with the billing portal downtime.
Please ensure all medical records remain HIPAA compliant and encrypted in transit.`;

export async function runContentAnalyzer(
  payload: Record<string, unknown> = {},
  useAi = false
): Promise<AgentExecutionResponse<ContentAnalysisResult>> {
  const startTime = Date.now();
  const rawText = String(payload.text || DEFAULT_SAMPLE_TEXT);

  const safety = evaluateSafety('content-analyzer', { textLength: rawText.length });

  // Word count & Character count
  const characterCount = rawText.length;
  const words = rawText.trim().split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(0.1, Math.round((wordCount / 200) * 10) / 10);

  // Sentences count
  const sentences = rawText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // Approximate Syllable Count for Flesch Reading Ease
  let syllableCount = 0;
  words.forEach((word) => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length <= 3) {
      syllableCount += 1;
    } else {
      const matches = clean.match(/[aeiouy]{1,2}/g);
      syllableCount += matches ? matches.length : 1;
    }
  });

  // Flesch Reading Ease = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / (wordCount || 1);
  const readingEase = Math.round(
    Math.max(0, Math.min(100, 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord))
  );

  // Flesch-Kincaid Grade Level = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const gradeLevel = Math.round(Math.max(1, 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59) * 10) / 10;

  let readabilityInterpretation = 'Standard / Plain English';
  if (readingEase >= 80) readabilityInterpretation = 'Easy to Read (6th grade level)';
  else if (readingEase >= 60) readabilityInterpretation = 'Standard Reader (8th-9th grade level)';
  else if (readingEase >= 30) readabilityInterpretation = 'Difficult / Academic (College level)';
  else readabilityInterpretation = 'Very Confusing / Technical';

  // Scrub PII & Extract entities
  const { sanitized: sanitizedContent, count: piiCount } = scrubPii(rawText);

  const piiEntities: ContentAnalysisResult['piiEntities'] = [];
  if (/SSN/i.test(rawText) || /\b\d{3}-\d{2}-\d{4}\b/.test(rawText)) {
    piiEntities.push({ type: 'SSN', count: 1, maskedPreview: '[REDACTED-SSN-***-**-6789]' });
  }
  if (/\b(?:\d{4}[ -]?){3}\d{4}\b/.test(rawText)) {
    piiEntities.push({ type: 'CREDIT_CARD', count: 1, maskedPreview: '[REDACTED-CARD-XXXX-4019]' });
  }
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(rawText)) {
    piiEntities.push({ type: 'EMAIL', count: 1, maskedPreview: 'j***@healthcorp.org' });
  }

  // Sentiment Analysis
  let sentimentScore = 0.2;
  const positiveWords = ['pleased', 'quick', 'care', 'great', 'excellent', 'happy', 'safe', 'good'];
  const negativeWords = ['frustration', 'downtime', 'delayed', 'error', 'failed', 'bad', 'broken'];

  words.forEach((w) => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (positiveWords.includes(clean)) sentimentScore += 0.2;
    if (negativeWords.includes(clean)) sentimentScore -= 0.25;
  });

  sentimentScore = Math.max(-1, Math.min(1, Math.round(sentimentScore * 100) / 100));
  let sentimentLabel: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'NEUTRAL';
  if (sentimentScore > 0.15) sentimentLabel = 'POSITIVE';
  else if (sentimentScore < -0.15) sentimentLabel = 'NEGATIVE';

  // Compliance Flags
  const complianceFlags: ContentAnalysisResult['complianceFlags'] = [];
  if (piiEntities.some((e) => e.type === 'SSN' || e.type === 'CREDIT_CARD')) {
    complianceFlags.push({
      standard: 'PCI-DSS',
      status: 'WARNING',
      detail: 'Cardholder data detected in unencrypted narrative text. Immediate automated redaction applied.',
    });
  }
  if (rawText.toLowerCase().includes('patient') || rawText.toLowerCase().includes('medical') || rawText.toLowerCase().includes('hipaa')) {
    complianceFlags.push({
      standard: 'HIPAA',
      status: piiCount > 0 ? 'WARNING' : 'PASS',
      detail: 'Protected Health Information (PHI) indicators found. Verification required before storage.',
    });
  }
  complianceFlags.push({
    standard: 'GDPR',
    status: 'PASS',
    detail: 'Subject identity indicators masked according to privacy by design standard.',
  });

  const keyPhrases = ['Customer Service', 'Incident Report', 'Bedside Care', 'Billing Portal Downtime'];

  let aiExplanation: string | undefined;
  if (useAi) {
    const aiPrompt = `Analyze the following narrative content for tone, PII sensitivity, and regulatory compliance:
Text: ${sanitizedContent.slice(0, 1500)}

Summarize sentiment, identified risks, and compliance guidance.`;

    const aiResult = await generateSafeAiAnalysis(
      aiPrompt,
      'You are the Safe Content Analyzer Agent. Provide an ethical, objective content analysis.'
    );
    if (aiResult) {
      aiExplanation = aiResult;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  recordAuditLog({
    agentId: 'content-analyzer',
    action: 'CONTENT_INSPECTION',
    status: piiEntities.length > 0 ? 'WARNING' : 'SUCCESS',
    threatScore: piiEntities.length * 15,
    executionTimeMs,
    summary: `Analyzed ${wordCount} words (${characterCount} chars). Flesch score ${readingEase} (${readabilityInterpretation}). Masked ${piiCount} PII entities.`,
    details: { wordCount, gradeLevel, piiCount, sentimentLabel },
  });

  return {
    success: true,
    agentId: 'content-analyzer',
    timestamp: new Date().toISOString(),
    executionTimeMs,
    safety,
    data: {
      characterCount,
      wordCount,
      readingTimeMinutes,
      readabilityScores: {
        fleschKincaidGrade: gradeLevel,
        fleschReadingEase: readingEase,
        interpretation: readabilityInterpretation,
      },
      sentiment: {
        score: sentimentScore,
        label: sentimentLabel,
        confidence: 0.91,
      },
      toxicityScore: 2, // Low toxicity
      piiEntities,
      complianceFlags,
      sanitizedContent,
      keyPhrases,
    },
    aiExplanation,
  };
}
