import React, { useState, useMemo } from 'react';
import { 
  X, 
  Code, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Folder, 
  Search, 
  Sparkles, 
  ExternalLink, 
  ChevronRight, 
  Layers, 
  FileCode,
  Info,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { PROJECT_SOURCE_FILES, SourceFileItem } from '../constants/sourceFilesBundle';

interface SourceCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SourceCodeViewerModal: React.FC<SourceCodeViewerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedPath, setSelectedPath] = useState<string>('src/App.tsx');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedFile, setCopiedFile] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter files by search
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return PROJECT_SOURCE_FILES;
    const q = searchQuery.toLowerCase();
    return PROJECT_SOURCE_FILES.filter(
      f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentFile = useMemo(() => {
    return PROJECT_SOURCE_FILES.find(f => f.path === selectedPath) || PROJECT_SOURCE_FILES[0];
  }, [selectedPath]);

  if (!isOpen) return null;

  // Copy current active file to clipboard
  const handleCopyCurrentFile = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopiedFile(true);
      setNotice(`Copied ${currentFile.name} to clipboard!`);
      setTimeout(() => {
        setCopiedFile(false);
        setNotice(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy file:', err);
    }
  };

  // Copy ALL website source files in one formatted bundle
  const handleCopyAllFiles = async () => {
    try {
      const bundleText = PROJECT_SOURCE_FILES.map(f => {
        const ext = f.name.split('.').pop() || 'typescript';
        return `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n\n` + f.content;
      }).join('\n\n\n');

      await navigator.clipboard.writeText(bundleText);
      setCopiedAll(true);
      setNotice(`Copied all ${PROJECT_SOURCE_FILES.length} website source files to clipboard!`);
      setTimeout(() => {
        setCopiedAll(false);
        setNotice(null);
      }, 3500);
    } catch (err) {
      console.error('Failed to copy all files:', err);
    }
  };

  // Download current file
  const handleDownloadCurrentFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice(`Downloaded ${currentFile.name}`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Download complete project bundle text
  const handleDownloadAllBundle = () => {
    const bundleText = PROJECT_SOURCE_FILES.map(f => {
      return `/* ==========================================================================\n` +
             ` * FILE: ${f.path}\n` +
             ` * ========================================================================== */\n\n` +
             f.content;
    }).join('\n\n\n');

    const blob = new Blob([bundleText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deriv_precision_analyzer_full_source_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice(`Downloaded full website source code bundle!`);
    setTimeout(() => setNotice(null), 3500);
  };

  // Category counts
  const categories = [
    { id: 'all', label: 'All Files', count: PROJECT_SOURCE_FILES.length },
    { id: 'core', label: 'Core App', count: PROJECT_SOURCE_FILES.filter(f => f.category === 'core').length },
    { id: 'components', label: 'Components', count: PROJECT_SOURCE_FILES.filter(f => f.category === 'components').length },
    { id: 'services', label: 'Services & Algorithms', count: PROJECT_SOURCE_FILES.filter(f => f.category === 'services').length },
    { id: 'utils', label: 'Utils', count: PROJECT_SOURCE_FILES.filter(f => f.category === 'utils').length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col text-slate-100 overflow-hidden relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-code-title"
      >
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 id="source-code-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Website Source Code</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {PROJECT_SOURCE_FILES.length} Files
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                View, copy, or download the full React + TypeScript source code of this trading terminal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Tap Copy All Code Button */}
            <button
              id="copy-all-website-code-btn"
              onClick={handleCopyAllFiles}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95"
              title="Copy the entire source code of all 37 files into your clipboard"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>All Code Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Whole Website</span>
                </>
              )}
            </button>

            {/* Download Full Bundle Button */}
            <button
              onClick={handleDownloadAllBundle}
              className="hidden md:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
              title="Download all source files combined into a text bundle"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Bundle</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Close code viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notice Toast */}
        {notice && (
          <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{notice}</span>
            </div>
            <span className="text-[10px] text-emerald-400/80">Ready to paste</span>
          </div>
        )}

        {/* Main Body Split: File List & Code Display */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: File Explorer */}
          <div className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 flex flex-col shrink-0">
            {/* Search Box */}
            <div className="p-2.5 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search file name or path..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* File List Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/30">
              {filteredFiles.map((file) => {
                const isSelected = file.path === selectedPath;
                return (
                  <button
                    key={file.path}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <div className="truncate">
                        <div className="font-semibold truncate">{file.name}</div>
                        <div className="text-[10px] text-slate-400 truncate opacity-80">{file.path}</div>
                      </div>
                    </div>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 shrink-0">
                      {file.category}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Export Tips */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>AI Studio Pro Tip:</span>
              </div>
              <p className="leading-snug">
                You can also download the complete original ZIP or export to GitHub directly from the top-right toolbar of Google AI Studio!
              </p>
            </div>
          </div>

          {/* Right Panel: File Preview & Copy Header */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Active File Actions Bar */}
            <div className="p-2.5 sm:p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-bold text-emerald-400 truncate">
                  {currentFile?.path}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  ({(currentFile?.content.length || 0).toLocaleString()} bytes)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCurrentFile}
                  className="py-1 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                  title="Copy this file's code to clipboard"
                >
                  {copiedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File Code</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadCurrentFile}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title="Download this file"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Code Text Viewer */}
            <div className="flex-1 overflow-auto p-3 sm:p-4 font-mono text-xs text-slate-300 leading-relaxed bg-slate-950 selection:bg-emerald-500/30">
              <pre className="whitespace-pre overflow-x-auto text-[11px] sm:text-xs font-mono">
                <code>{currentFile?.content}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
