import React, { useState, useEffect } from 'react';
import {
  Code,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Shield,
  Layers,
  Search,
  Server,
  Database,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText
} from 'lucide-react';

interface BackendFileItem {
  path: string;
  label: string;
  category: string;
  lineCount: number;
  sizeBytes: number;
  content: string;
}

export const BackendCodeViewer: React.FC = () => {
  const [files, setFiles] = useState<BackendFileItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('server.ts');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchBackendFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backend-files');
      const data = await res.json();
      if (data.success && data.files) {
        setFiles(data.files);
        if (!selectedPath && data.files.length > 0) {
          setSelectedPath(data.files[0].path);
        }
      }
    } catch (err) {
      console.error('Error fetching backend files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBackendFiles();
  }, []);

  const selectedFile = files.find((f) => f.path === selectedPath) || files[0];

  const handleCopyCode = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!selectedFile) return;
    const blob = new Blob([selectedFile.content], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.path.split('/').pop() || 'backend-code.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllAsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(files, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'safe-agents-backend-source-bundle.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const categories = ['all', ...Array.from(new Set(files.map((f) => f.category)))];

  const filteredFiles = files.filter((f) => {
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    const matchesSearch =
      f.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core Server':
        return <Server className="h-4 w-4 text-sky-400" />;
      case 'Security':
        return <Shield className="h-4 w-4 text-emerald-400" />;
      case 'Agent Engine':
        return <Layers className="h-4 w-4 text-indigo-400" />;
      case 'Agent Logic':
        return <Cpu className="h-4 w-4 text-amber-400" />;
      default:
        return <FileCode className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/30 text-indigo-400 ring-1 ring-indigo-500/40">
              <Code className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Real Backend Codebase & Agent Engines</h2>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Live, functional TypeScript backend source files powering all 10 Safe Agents, safety guardrails, AST parsers, and Express API routes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="download-all-bundle-btn"
            onClick={handleDownloadAllAsJSON}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700 transition"
          >
            <Download className="h-4 w-4 text-indigo-400" />
            <span>Export All Files (Bundle)</span>
          </button>
          <button
            id="refresh-backend-files-btn"
            onClick={fetchBackendFiles}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main File Browser & Code Viewer Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: File Directory & Search */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 backdrop-blur shadow-md">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="search-backend-files-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search backend files & code..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    filterCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Files' : cat}
                </button>
              ))}
            </div>

            {/* File List */}
            <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading backend files...</div>
              ) : filteredFiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No matching backend files found.</div>
              ) : (
                filteredFiles.map((file) => {
                  const isSelected = selectedPath === file.path;
                  return (
                    <button
                      key={file.path}
                      id={`file-btn-${file.path.replace(/[/.]/g, '-')}`}
                      onClick={() => setSelectedPath(file.path)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition ${
                        isSelected
                          ? 'bg-indigo-600/20 text-white ring-1 ring-indigo-500/50'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getCategoryIcon(file.category)}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{file.path}</p>
                          <p className="text-[10px] text-slate-500">{file.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                        <span>{file.lineCount} lines</span>
                        <ChevronRight className={`h-3 w-3 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Architecture Note */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Full-Stack Sandboxed Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Every agent executes server-side in Node.js with strict AST validation, ReDoS circuit breakers, in-memory SQL sandboxes, and SHA256 entropy analysis.
            </p>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 space-y-3">
          {selectedFile ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
              {/* Code Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span className="font-mono text-xs font-semibold text-slate-200">{selectedFile.path}</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    {selectedFile.lineCount} lines • {(selectedFile.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="copy-selected-code-btn"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>

                  <button
                    id="download-selected-file-btn"
                    onClick={handleDownloadFile}
                    className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .ts</span>
                  </button>
                </div>
              </div>

              {/* Code Content Area */}
              <div className="relative max-h-[640px] overflow-auto bg-slate-950 p-4 font-mono text-xs text-slate-300">
                <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                  <code>
                    {selectedFile.content.split('\n').map((line, idx) => (
                      <div key={idx} className="table-row hover:bg-slate-900/60">
                        <span className="table-cell select-none pr-4 text-right text-slate-600 text-[11px] w-10">
                          {idx + 1}
                        </span>
                        <span className="table-cell text-slate-200 font-mono">{line}</span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-500 text-sm">
              Select a backend file to view source code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
