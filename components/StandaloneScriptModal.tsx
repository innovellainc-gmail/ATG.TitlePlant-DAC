'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  X,
  Terminal,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { PLAYWRIGHT_NODE_SCRIPT, PLAYWRIGHT_PYTHON_SCRIPT } from '@/lib/script-templates';

interface StandaloneScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneScriptModal: React.FC<StandaloneScriptModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'node' | 'python' | 'readme'>('node');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentContent =
    activeTab === 'node'
      ? PLAYWRIGHT_NODE_SCRIPT
      : activeTab === 'python'
      ? PLAYWRIGHT_PYTHON_SCRIPT
      : `# Doña Ana County Public Records Browser Automation
## Portal: https://donaana.nm.publicsearch.us/

### Quickstart Guide (Node.js + Playwright)
1. Initialize project & install Playwright:
   \`\`\`bash
   mkdir dona-ana-scraper && cd dona-ana-scraper
   npm init -y
   npm install playwright
   npx playwright install chromium
   \`\`\`

2. Create \`donaana_playwright.js\` and paste the Node.js script.

3. Run the automation:
   \`\`\`bash
   # Run headed (watch the browser interact in real-time)
   node donaana_playwright.js

   # Or run headless in background
   HEADLESS=true node donaana_playwright.js
   \`\`\`

### Quickstart Guide (Python + Playwright)
1. Setup Python virtual environment & Playwright:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # Or .\\venv\\Scripts\\activate on Windows
   pip install playwright
   playwright install chromium
   \`\`\`

2. Run the Python script:
   \`\`\`bash
   python donaana_playwright.py
   \`\`\`
`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'node'
        ? 'donaana_playwright.js'
        : activeTab === 'python'
        ? 'donaana_playwright.py'
        : 'README_AUTOMATION.md';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-blue-950/80 border border-blue-800 text-blue-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">
                Production Playwright Automation Source Code
              </h3>
              <p className="text-[11px] text-slate-400">
                Standalone scripts ready for local execution or containerized batch runs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 cursor-pointer text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('node')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'node'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Node.js Playwright (donaana_playwright.js)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'python'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Python Playwright (donaana_playwright.py)</span>
          </button>

          <button
            onClick={() => setActiveTab('readme')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'readme'
                ? 'bg-blue-950/80 text-blue-300 border border-blue-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Setup Instructions</span>
          </button>
        </div>

        {/* Code Content View */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre">{currentContent}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px]">Fully resilient multi-tiered DOM selectors for https://donaana.nm.publicsearch.us/</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
