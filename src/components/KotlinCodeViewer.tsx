import React, { useState } from 'react';
import { Copy, Check, FileCode, FolderTree, Download, ExternalLink } from 'lucide-react';
import { ANDROID_SOURCE_FILES } from '../data/androidSources';

export const KotlinCodeViewer: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(ANDROID_SOURCE_FILES[0].id);
  const [copied, setCopied] = useState(false);

  const currentFile = ANDROID_SOURCE_FILES.find(f => f.id === selectedFileId) || ANDROID_SOURCE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    // Generate a single consolidated markdown bundle
    const bundle = ANDROID_SOURCE_FILES.map(
      f => `// ==========================================\n// FILE: ${f.path}\n// ==========================================\n\n${f.content}\n\n`
    ).join('\n');

    const blob = new Blob([bundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HexaColorQuest_Android_Kotlin_Source.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      {/* Top Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Native Android Kotlin & Jetpack Compose</h3>
            <p className="text-xs text-slate-400 font-mono">Complete Gradle Project Architecture & Unit Tests</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All Files</span>
          </button>
        </div>
      </div>

      {/* Main Split: Sidebar + Code Editor View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Tree Sidebar */}
        <div className="w-64 bg-slate-950/70 border-r border-slate-800 overflow-y-auto p-2 flex flex-col gap-1 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
            Android Studio Project Files
          </span>

          {ANDROID_SOURCE_FILES.map(file => {
            const isSelected = file.id === selectedFileId;
            return (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Code Display Area */}
        <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden">
          {/* File Path Header */}
          <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{currentFile.path}</span>
            <span className="text-[11px] text-indigo-400 font-semibold">{currentFile.language}</span>
          </div>

          {/* Pre Code */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
            <pre className="whitespace-pre">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
