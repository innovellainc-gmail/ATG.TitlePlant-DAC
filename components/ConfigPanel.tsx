'use client';

import React from 'react';
import { Sliders, Calendar, Gauge, Cpu, Check, Layers } from 'lucide-react';
import { AutomationConfig, AutomationState } from '@/lib/types';

interface ConfigPanelProps {
  config: AutomationConfig;
  state: AutomationState;
  onChangeConfig: (newConfig: Partial<AutomationConfig>) => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, state, onChangeConfig }) => {
  const isRunning = state.status === 'running' || state.status === 'paused';

  const setPresetRange = (start: string, end: string) => {
    if (isRunning) return;
    onChangeConfig({ startDate: start, endDate: end });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Configurable Parameters
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          Target: <span className="text-slate-700 font-semibold">donaana.nm.publicsearch.us</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Date Range Controls */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Recording Date Range
            </label>
            <span className="text-[9px] text-blue-600 font-mono font-semibold">Customizable</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Start Date</label>
              <input
                type="text"
                disabled={isRunning}
                value={config.startDate}
                onChange={(e) => onChangeConfig({ startDate: e.target.value })}
                placeholder="MM/DD/YYYY"
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">End Date</label>
              <input
                type="text"
                disabled={isRunning}
                value={config.endDate}
                onChange={(e) => onChangeConfig({ endDate: e.target.value })}
                placeholder="MM/DD/YYYY"
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setPresetRange('1/1/1978', '1/5/1978')}
              className="text-[9px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer disabled:opacity-50 transition-colors"
              title="Official 161 verified records from Doña Ana County portal (1/1/1978 - 1/5/1978)"
            >
              1/1/1978 - 1/5/1978 (161 Docs)
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setPresetRange('1/1/1930', '5/31/1930')}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
              title="Official 7 verified records from Doña Ana County portal"
            >
              1/1/1930 - 5/31/1930 (7 Docs)
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setPresetRange('1/1/1930', '12/31/1930')}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
            >
              1930
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setPresetRange('01/01/2024', '12/31/2024')}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
            >
              2024
            </button>
          </div>
        </div>

        {/* Search Type & Filter Mode */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Portal Search Mode
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeConfig({ searchType: 'INDEX_ONLY' })}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${
                config.searchType === 'INDEX_ONLY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {config.searchType === 'INDEX_ONLY' && <Check className="w-3 h-3" />}
              Index Only
            </button>

            <button
              type="button"
              disabled={isRunning}
              onClick={() => onChangeConfig({ searchType: 'ALL_DOCS' })}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 ${
                config.searchType === 'ALL_DOCS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {config.searchType === 'ALL_DOCS' && <Check className="w-3 h-3" />}
              All Recorded
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Index Only: Official free historical grantor/grantee index extraction.
          </p>
        </div>

        {/* Rate Limiting & Throttling */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              Throttling Interval
            </label>
            <span className="text-xs font-mono font-bold text-blue-600">
              {config.throttleMs}ms
            </span>
          </div>

          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            disabled={isRunning}
            value={config.throttleMs}
            onChange={(e) => onChangeConfig({ throttleMs: parseInt(e.target.value, 10) })}
            className="w-full accent-blue-600 cursor-pointer disabled:opacity-60"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>200ms (Fast)</span>
            <span>650ms (Optimal)</span>
            <span>3000ms (Safe)</span>
          </div>
        </div>

        {/* Execution Mode & Safety Controls */}
        <div className="space-y-2">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Worker Flags & Safety
          </label>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Headless Execution</span>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => onChangeConfig({ headless: !config.headless })}
                className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                  config.headless ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${
                    config.headless ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Auto-Order Submission</span>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => onChangeConfig({ autoCheckout: !config.autoCheckout })}
                className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                  config.autoCheckout ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${
                    config.autoCheckout ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Package Auto-Download</span>
              <button
                type="button"
                disabled={isRunning}
                onClick={() => onChangeConfig({ autoDownload: !config.autoDownload })}
                className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                  config.autoDownload ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${
                    config.autoDownload ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
