import React from 'react';
import { AlertCircle, BookOpen, CheckCircle2, FileText, Lock, ShieldCheck, Smile } from 'lucide-react';
import { ContentAnalysisResult } from '../../types';

interface ContentAnalyzerViewProps {
  data: ContentAnalysisResult;
}

export const ContentAnalyzerView: React.FC<ContentAnalyzerViewProps> = ({ data }) => {
  return (
    <div className="space-y-4 text-slate-200">
      {/* 4 Score Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Readability */}
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Flesch Reading Ease</div>
          <div className="mt-1 font-mono text-xl font-bold text-indigo-400">
            {data.readabilityScores.fleschReadingEase} / 100
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Grade: {data.readabilityScores.fleschKincaidGrade} ({data.readabilityScores.interpretation})
          </div>
        </div>

        {/* Sentiment */}
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Sentiment Score</div>
          <div
            className={`mt-1 font-mono text-xl font-bold ${
              data.sentiment.label === 'POSITIVE'
                ? 'text-emerald-400'
                : data.sentiment.label === 'NEGATIVE'
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {data.sentiment.label} ({data.sentiment.score})
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Confidence: {Math.round(data.sentiment.confidence * 100)}%
          </div>
        </div>

        {/* Word Counts */}
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Word Count</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">{data.wordCount}</div>
          <div className="mt-1 text-[10px] text-slate-400">
            ~{data.readingTimeMinutes} min reading time
          </div>
        </div>

        {/* Toxicity */}
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Toxicity Index</div>
          <div className="mt-1 font-mono text-xl font-bold text-emerald-400">{data.toxicityScore}% (Safe)</div>
          <div className="mt-1 text-[10px] text-slate-400">Zero Harassment Passed</div>
        </div>
      </div>

      {/* Compliance Standards Status */}
      <div className="space-y-2 rounded-xl bg-slate-900/50 p-3.5 ring-1 ring-slate-800">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Regulatory Compliance Status
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {data.complianceFlags.map((flag, idx) => (
            <div
              key={idx}
              className={`rounded-lg p-2.5 text-xs ring-1 ${
                flag.status === 'PASS'
                  ? 'bg-emerald-950/30 text-emerald-300 ring-emerald-500/20'
                  : 'bg-amber-950/30 text-amber-300 ring-amber-500/20'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>{flag.standard}</span>
                <span className="text-[10px] uppercase">{flag.status}</span>
              </div>
              <p className="mt-1 text-[11px] opacity-90">{flag.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sanitized Text Preview */}
      <div className="rounded-xl bg-slate-900/50 p-3.5 ring-1 ring-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Sanitized Narrative (PII Redacted)
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Lock className="h-3 w-3" /> Safe Entity View
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 bg-slate-950 p-3 rounded-lg ring-1 ring-slate-800">
          {data.sanitizedContent}
        </p>
      </div>
    </div>
  );
};
