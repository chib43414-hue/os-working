import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Code2, Copy, FileCode2, ShieldAlert } from 'lucide-react';
import { CodeAnalysisResult } from '../../types';

interface CodeAssistantViewProps {
  data: CodeAnalysisResult;
}

export const CodeAssistantView: React.FC<CodeAssistantViewProps> = ({ data }) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'remediation' | 'tests'>('remediation');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 text-slate-200">
      {/* Complexity & Metric KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Lines of Code (LOC)</div>
          <div className="mt-1 font-mono text-xl font-bold text-slate-100">{data.loc}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-slate-400">Cyclomatic Complexity</div>
          <div className="mt-1 font-mono text-xl font-bold text-indigo-400">{data.cyclomaticComplexity}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-rose-400">OWASP Vulnerabilities</div>
          <div className="mt-1 font-mono text-xl font-bold text-rose-400">{data.securityVulnerabilities.length}</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 p-3 ring-1 ring-slate-800">
          <div className="text-xs text-amber-400">Code Smells</div>
          <div className="mt-1 font-mono text-xl font-bold text-amber-400">{data.codeSmells.length}</div>
        </div>
      </div>

      {/* Vulnerabilities List */}
      {data.securityVulnerabilities.length > 0 && (
        <div className="space-y-2 rounded-xl bg-rose-950/30 p-3.5 ring-1 ring-rose-500/30">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
            <ShieldAlert className="h-4 w-4" /> Detected Security Vulnerabilities
          </div>
          <div className="space-y-2">
            {data.securityVulnerabilities.map((vuln, idx) => (
              <div key={idx} className="rounded-lg bg-slate-950/80 p-3 text-xs ring-1 ring-rose-500/20">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-200">{vuln.title}</span>
                  <span className="rounded bg-rose-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                    {vuln.cwe} - Line {vuln.line}
                  </span>
                </div>
                <p className="mt-1 text-slate-300">{vuln.description}</p>
                <div className="mt-2 rounded bg-indigo-950/40 p-2 text-[11px] text-indigo-300 ring-1 ring-indigo-500/20">
                  <span className="font-semibold text-indigo-200">Remediation:</span> {vuln.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabbed Hardened Code & Unit Tests */}
      <div className="rounded-xl bg-slate-900/50 ring-1 ring-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCodeTab('remediation')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeCodeTab === 'remediation'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hardened Code Snippet
            </button>
            <button
              onClick={() => setActiveCodeTab('tests')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeCodeTab === 'tests'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Generated Unit Tests
            </button>
          </div>
          <button
            onClick={() =>
              handleCopy(activeCodeTab === 'remediation' ? data.optimizedCodeSnippet || '' : data.generatedUnitTests || '')
            }
            className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
          >
            <Copy className="h-3 w-3" /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="max-h-64 overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-slate-300">
          {activeCodeTab === 'remediation' ? data.optimizedCodeSnippet : data.generatedUnitTests}
        </pre>
      </div>
    </div>
  );
};
