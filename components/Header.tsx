'use client';

import React from 'react';
import { Play, Pause, Square, RotateCcw, Download, ShieldCheck, Database, ShoppingBag, Clock, FileCode2, Sliders } from 'lucide-react';
import { AutomationState } from '@/lib/types';

interface HeaderProps {
  state: AutomationState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onOpenScriptModal: () => void;
  onDownloadPackage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onOpenScriptModal,
  onDownloadPackage,
}) => {
  const getStatusBadge = () => {
    switch (state.status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#10b981] animate-ping" />
            RUNNING
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            PAUSED
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            COMPLETED
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            HALTED
          </span>
        );
      case 'aborted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-700 text-slate-300 border border-slate-600">
            ABORTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-400 border border-slate-700">
            IDLE / READY
          </span>
        );
    }
  };

  const formatElapsed = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 sm:px-6 border-b border-slate-700 shrink-0 sticky top-0 z-30">
      {/* Brand & County Target */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xs text-white shadow-xs tracking-wider shrink-0">
          TP
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight uppercase text-white flex items-center">
            TITLEPLANT
            <span className="text-slate-400 font-light text-xs sm:text-sm normal-case tracking-normal ml-1.5 hidden md:inline">
              Automation Engine
            </span>
          </h1>
          {getStatusBadge()}
        </div>
      </div>

      {/* Target & Session Quick Meta */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
          <span>Target: <strong className="text-white font-medium">Doña Ana, NM</strong></span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Session: <strong className="text-white">{formatElapsed(state.elapsedMs)}</strong></span>
        </div>
      </div>

      {/* Primary Action Controls */}
      <div className="flex items-center gap-2">
        {state.status === 'idle' || state.status === 'completed' || state.status === 'error' || state.status === 'aborted' ? (
          <button
            id="start-automation-btn"
            onClick={onStart}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
          >
            <div className="w-2 h-2 bg-white rounded-xs rotate-45" />
            {state.status === 'idle' ? 'START AUTOMATION' : 'RESTART PROCESS'}
          </button>
        ) : null}

        {state.status === 'running' && (
          <>
            <button
              id="pause-automation-btn"
              onClick={onPause}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold px-3 py-2 rounded border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              PAUSE
            </button>
            <button
              id="stop-automation-btn"
              onClick={onStop}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              ABORT PROCESS
            </button>
          </>
        )}

        {state.status === 'paused' && (
          <>
            <button
              id="resume-automation-btn"
              onClick={onResume}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              RESUME
            </button>
            <button
              id="stop-paused-btn"
              onClick={onStop}
              className="bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white text-xs font-bold px-3 py-2 rounded border border-slate-700 cursor-pointer transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              ABORT
            </button>
          </>
        )}

        <button
          id="reset-state-btn"
          onClick={onReset}
          title="Reset State"
          className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          id="view-script-btn"
          onClick={onOpenScriptModal}
          title="View Standalone Playwright Script"
          className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Worker Scripts</span>
        </button>

        {state.orderConfirmationId && (
          <button
            id="download-pkg-btn"
            onClick={onDownloadPackage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download Package</span>
          </button>
        )}
      </div>
    </header>
  );
};
