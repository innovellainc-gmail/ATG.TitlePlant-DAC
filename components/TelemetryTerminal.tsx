'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Search, Copy, Check, Trash2, ArrowDown, Filter } from 'lucide-react';
import { TelemetryLog } from '@/lib/types';

interface TelemetryTerminalProps {
  logs: TelemetryLog[];
  onClearLogs?: () => void;
}

export const TelemetryTerminal: React.FC<TelemetryTerminalProps> = ({ logs, onClearLogs }) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(q) ||
        log.step.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyLogs = async () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.step}] ${l.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadgeClass = (level: TelemetryLog['level']) => {
    switch (level) {
      case 'DOM_ACTION':
        return 'text-blue-400 bg-blue-950/80 border-blue-800';
      case 'SELECTOR_HIT':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'CART_UPDATE':
        return 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
      case 'SUCCESS':
        return 'text-emerald-300 bg-emerald-950/80 border-emerald-700';
      case 'WARN':
        return 'text-yellow-400 bg-yellow-950/80 border-yellow-800';
      case 'ERROR':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      default:
        return 'text-slate-400 bg-slate-800/80 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-950 text-slate-200 rounded-lg border border-slate-800 flex flex-col h-full min-h-[460px] shadow-2xl font-mono text-xs overflow-hidden">
      {/* Terminal Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            Telemetry Stream Console
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
            {filteredLogs.length} EVENTS
          </span>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 text-[11px]">
          {/* Search */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter stream..."
              className="bg-slate-950 border border-slate-800 rounded pl-6 pr-2 py-0.5 text-slate-200 focus:outline-none focus:border-blue-500 w-28 sm:w-36 text-[10px]"
            />
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 text-[10px] focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">ALL LEVELS</option>
              <option value="DOM_ACTION">DOM_ACTION</option>
              <option value="SELECTOR_HIT">SELECTOR_HIT</option>
              <option value="CART_UPDATE">CART_UPDATE</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          {/* Autoscroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded cursor-pointer transition-colors ${
              autoScroll ? 'text-blue-400 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Auto-scroll to bottom"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-colors"
            title="Copy Logs to Clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Logs Output */}
      <div className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-[10px] leading-relaxed select-text">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-600 font-mono text-xs">
            {`// Awaiting browser automation events or worker activity...`}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-1.5 hover:bg-slate-900/80 p-0.5 rounded">
              <span className="text-slate-500 shrink-0 text-[10px] select-none font-mono">
                [{log.timestamp}]
              </span>

              <span
                className={`text-[9px] px-1 py-0.2 rounded border font-bold shrink-0 select-none ${getLevelBadgeClass(
                  log.level
                )}`}
              >
                {log.level}
              </span>

              <span className="text-slate-400 text-[10px] shrink-0 font-medium select-none">
                [{log.step}]
              </span>

              <span
                className={`break-all ${
                  log.level === 'ERROR'
                    ? 'text-rose-400 font-bold'
                    : log.level === 'SUCCESS'
                    ? 'text-emerald-300 font-medium'
                    : log.level === 'CART_UPDATE'
                    ? 'text-emerald-400 font-medium'
                    : log.level === 'SELECTOR_HIT'
                    ? 'text-amber-300'
                    : log.level === 'DOM_ACTION'
                    ? 'text-blue-300'
                    : 'text-slate-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Terminal Footer */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-3 py-1 text-[10px] text-slate-400 flex items-center justify-between select-none">
        <span>Channel: SSE Stream / Node Worker CDC</span>
        <span>Target: NM_DONA_ANA_COUNTY</span>
      </div>
    </div>
  );
};
