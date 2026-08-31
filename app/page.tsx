'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { WorkflowPipeline } from '@/components/WorkflowPipeline';
import { ConfigPanel } from '@/components/ConfigPanel';
import { ViewportSimulator } from '@/components/ViewportSimulator';
import { TelemetryTerminal } from '@/components/TelemetryTerminal';
import { RecordsTable } from '@/components/RecordsTable';
import { StandaloneScriptModal } from '@/components/StandaloneScriptModal';
import { AutomationConfig, AutomationState, PublicRecord, TelemetryLog, TelemetryEvent } from '@/lib/types';

export default function DonaAnaAutomationDashboard() {
  const [state, setState] = useState<AutomationState>({
    runId: 'idle',
    status: 'idle',
    currentStep: 'STEP_INIT',
    stepDescription: 'Ready to start automation sequence.',
    totalRecordsFound: 0,
    recordsProcessed: 0,
    itemsInCart: 0,
    currentPage: 1,
    totalPages: 1,
    activeRecordId: null,
    activeSelector: null,
    startTime: null,
    endTime: null,
    elapsedMs: 0,
    orderConfirmationId: null,
    downloadPackageName: null,
    errorMessage: null,
    retryCount: 0,
    currentViewportState: {
      pageTitle: 'Doña Ana County, NM - Public Records Search',
      url: 'https://donaana.nm.publicsearch.us/',
      actionHighlight: null,
      modalOpen: false,
      popoverOpen: false,
      cartBadgeCount: 0,
    },
  });

  const [config, setConfig] = useState<AutomationConfig>({
    portalUrl: 'https://donaana.nm.publicsearch.us/',
    startDate: '1/1/1930',
    endDate: '12/31/1930',
    searchType: 'INDEX_ONLY',
    headless: true,
    throttleMs: 650,
    maxPages: 4,
    maxRecords: 24,
    autoCheckout: true,
    autoDownload: true,
    retryLimit: 3,
    enableVisualFrameStream: true,
  });

  const [records, setRecords] = useState<PublicRecord[]>([]);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'viewport' | 'terminal'>('viewport');

  // SSE Stream Connection
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/automation/events');

      eventSource.onmessage = (e) => {
        try {
          const event: TelemetryEvent = JSON.parse(e.data);

          if (event.type === 'STATE_UPDATE' && event.state) {
            setState(event.state);
            if (event.records) {
              setRecords(event.records);
            }
          } else if (event.type === 'LOG_APPEND' && event.log) {
            setLogs((prev) => [...prev, event.log!].slice(-500));
          } else if (event.type === 'RECORD_UPDATE' && event.record) {
            setRecords((prev) => {
              const idx = prev.findIndex((r) => r.id === event.record!.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = event.record!;
                return next;
              }
              return [...prev, event.record!];
            });
          } else if (event.type === 'RECORD_BATCH' && event.records) {
            setRecords(event.records);
          } else if (event.type === 'COMPLETE' && event.state) {
            setState(event.state);
          }
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        // Reconnect after 3 seconds
        setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    // Initial status fetch
    fetch('/api/automation/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.state) setState(data.state);
        if (data.config) setConfig(data.config);
        if (data.records) setRecords(data.records);
        if (data.logs) setLogs(data.logs);
      })
      .catch((err) => console.error('Error fetching initial status:', err));

    return () => {
      eventSource?.close();
    };
  }, []);

  // Polling fallback to guarantee live updates even through buffered proxies
  useEffect(() => {
    if (state.status !== 'running' && state.status !== 'paused') {
      return;
    }

    const pollInterval = setInterval(() => {
      fetch('/api/automation/status')
        .then((res) => res.json())
        .then((data) => {
          if (data.state) setState(data.state);
          if (data.records) setRecords(data.records);
          if (data.logs) setLogs(data.logs);
        })
        .catch(() => {});
    }, 650);

    return () => clearInterval(pollInterval);
  }, [state.status]);

  const handleStart = async () => {
    try {
      // Optimistic update so user immediately sees reaction
      setState((prev) => ({
        ...prev,
        status: 'running',
        stepDescription: 'Launching automation sequence...',
      }));

      const res = await fetch('/api/automation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!data.success) {
        alert(`Failed to start: ${data.error}`);
        // Refresh actual state
        const statusRes = await fetch('/api/automation/status');
        const statusData = await statusRes.json();
        if (statusData.state) setState(statusData.state);
      } else {
        if (data.state) setState(data.state);
        if (data.records) setRecords(data.records);
        if (data.logs) setLogs(data.logs);
      }
    } catch (err: any) {
      alert(`Error starting automation: ${err.message}`);
    }
  };

  const handleControl = async (action: 'pause' | 'resume' | 'stop' | 'reset') => {
    try {
      const res = await fetch('/api/automation/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.state) setState(data.state);
      if (action === 'reset') {
        setRecords([]);
        setLogs([]);
      }
    } catch (err) {
      console.error(`Control error for ${action}:`, err);
    }
  };

  const handleConfigChange = (newConfig: Partial<AutomationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const handleExportCsv = () => {
    window.open('/api/automation/export?format=csv', '_blank');
  };

  const handleExportJson = () => {
    window.open('/api/automation/export?format=json', '_blank');
  };

  const handleDownloadPackage = () => {
    window.open('/api/automation/download-package', '_blank');
  };

  const activeRecord = records.find((r) => r.id === state.activeRecordId) || null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Top Application Header */}
      <Header
        state={state}
        onStart={handleStart}
        onPause={() => handleControl('pause')}
        onResume={() => handleControl('resume')}
        onStop={() => handleControl('stop')}
        onReset={() => handleControl('reset')}
        onOpenScriptModal={() => setIsScriptModalOpen(true)}
        onDownloadPackage={handleDownloadPackage}
      />

      {/* Main Interactive Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Step-by-Step Workflow Pipeline */}
        <WorkflowPipeline state={state} />

        {/* Configuration Parameters Deck */}
        <ConfigPanel config={config} state={state} onChangeConfig={handleConfigChange} />

        {/* Split View: Live Viewport Simulator & Real-Time Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Viewport Simulator (60% on desktop) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Live Headless Viewport & DOM Action Visualizer
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Port: 3000 • Stream: Active
              </span>
            </div>
            <div className="flex-1">
              <ViewportSimulator
                state={state}
                config={config}
                activeRecord={activeRecord}
                records={records}
              />
            </div>
          </div>

          {/* Telemetry Stream Console (40% on desktop) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Execution Logs & Telemetry Stream
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Total Logs: {logs.length}
              </span>
            </div>
            <div className="flex-1">
              <TelemetryTerminal logs={logs} onClearLogs={() => setLogs([])} />
            </div>
          </div>
        </div>

        {/* Indexed Public Records Table & Audit Grid */}
        <RecordsTable
          records={records}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onDownloadPackage={handleDownloadPackage}
        />
      </main>

      {/* Standalone Playwright Script & CLI Instructions Modal */}
      <StandaloneScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
    </div>
  );
}
