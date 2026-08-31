'use client';

import React, { useState } from 'react';
import {
  Monitor,
  Lock,
  RefreshCw,
  Search,
  ShoppingCart,
  Check,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Sparkles,
  Maximize2,
  Minimize2,
  Camera,
} from 'lucide-react';
import { AutomationConfig, AutomationState, PublicRecord } from '@/lib/types';

interface ViewportSimulatorProps {
  state: AutomationState;
  config: AutomationConfig;
  activeRecord: PublicRecord | null;
  records: PublicRecord[];
}

export const ViewportSimulator: React.FC<ViewportSimulatorProps> = ({
  state,
  config,
  activeRecord,
  records,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [capturedFlash, setCapturedFlash] = useState(false);

  const isCartPage = state.currentStep === 'STEP_CART_NAVIGATION' || state.currentStep === 'STEP_PLACE_ORDER' || state.currentStep === 'STEP_DOWNLOAD_PACKAGE' || (state.status === 'completed' && state.orderConfirmationId);
  const isSearchPage = !isCartPage;

  const currentRecordsOnPage = records.filter(
    (r) => r.pageNumber === state.currentPage || records.length <= 6
  ).slice(0, 6);

  const handleCaptureSnapshot = () => {
    setCapturedFlash(true);
    setTimeout(() => setCapturedFlash(false), 400);
  };

  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs flex flex-col transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl bg-white' : 'h-full min-h-[460px]'
      }`}
    >
      {/* Browser Chrome Header */}
      <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-[10px]">Headless Viewport (1440x900)</span>
          </span>
        </div>

        {/* Address Bar */}
        <div className="flex-1 max-w-lg bg-white border border-slate-200 rounded px-2.5 py-1 flex items-center gap-2 text-xs font-mono text-slate-600 truncate shadow-2xs">
          <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">
            {isCartPage
              ? 'https://donaana.nm.publicsearch.us/cart'
              : 'https://donaana.nm.publicsearch.us/search/index-only'}
          </span>
          {state.status === 'running' && (
            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin shrink-0 ml-auto" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCaptureSnapshot}
            title="Capture Viewport Screenshot"
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Viewport Rendered Content Area */}
      <div className={`relative flex-1 bg-slate-50 overflow-y-auto p-3 sm:p-4 font-sans text-slate-800 ${capturedFlash ? 'ring-4 ring-blue-400 animate-pulse' : ''}`}>
        {/* County Portal Mock Header */}
        <div className="bg-slate-900 text-white rounded p-3 mb-3 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
              DA
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide">DOÑA ANA COUNTY CLERK & RECORDER</div>
              <div className="text-[10px] text-slate-400">Public Records Search Portal • Las Cruces, NM</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`relative flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold ${
                state.activeSelector?.includes('cart')
                  ? 'border border-blue-400 bg-blue-600/30 ring-2 ring-blue-400 text-white'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-blue-400" />
              <span>Cart</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold">
                {state.itemsInCart}
              </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: SEARCH & RESULTS VIEW */}
        {/* ------------------------------------------------------------- */}
        {isSearchPage && (
          <div className="space-y-3">
            {/* Search Form Banner */}
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    config.searchType === 'INDEX_ONLY'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  Index Only Search Mode
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Range: {config.startDate} – {config.endDate}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div
                  className={`p-2 rounded border text-xs ${
                    state.currentStep === 'STEP_DATE_INPUT' && state.activeSelector?.includes('startDate')
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">Start Date</span>
                  <span className="font-mono font-bold text-slate-800">{config.startDate}</span>
                </div>

                <div
                  className={`p-2 rounded border text-xs ${
                    state.currentStep === 'STEP_DATE_INPUT' && state.activeSelector?.includes('endDate')
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">End Date</span>
                  <span className="font-mono font-bold text-slate-800">{config.endDate}</span>
                </div>

                <div
                  className={`p-2 rounded border text-xs flex items-center justify-center gap-1.5 font-bold ${
                    state.currentStep === 'STEP_SEARCH_SUBMIT'
                      ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400 shadow-xs'
                      : 'bg-slate-900 text-white border-slate-800'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Public Records</span>
                </div>
              </div>
            </div>

            {/* Results Grid Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">
                  Search Results ({state.totalRecordsFound} Records Found)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Page {state.currentPage} of {state.totalPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-3">Instrument</th>
                      <th className="py-2 px-3">Book/Page</th>
                      <th className="py-2 px-3">Recorded</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Grantor / Grantee</th>
                      <th className="py-2 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecordsOnPage.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                          {state.status === 'idle'
                            ? 'Ready. Click "Start Automation" to execute search query.'
                            : 'Waiting for table hydration...'}
                        </td>
                      </tr>
                    ) : (
                      currentRecordsOnPage.map((rec) => {
                        const isTargeted = activeRecord?.id === rec.id;
                        return (
                          <tr
                            key={rec.id}
                            className={`transition-colors ${
                              isTargeted
                                ? 'bg-blue-50/80 ring-1 ring-blue-500 shadow-2xs font-medium'
                                : rec.cartStatus === 'in_cart'
                                ? 'bg-emerald-50/40'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2 px-3 font-mono font-bold text-blue-700">
                              {rec.instrumentNumber}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-500">
                              {rec.bookPage}
                            </td>
                            <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                              {rec.recordingDate}
                            </td>
                            <td className="py-2 px-3 font-medium text-slate-700">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700">
                                {rec.docType}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                              <span className="font-semibold text-slate-800">{rec.grantor}</span>
                              <span className="text-slate-400 mx-1">→</span>
                              <span>{rec.grantee}</span>
                            </td>
                            <td className="py-2 px-3 text-right relative">
                              {rec.cartStatus === 'in_cart' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                  <Check className="w-3 h-3" /> In Cart
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className={`p-1 rounded border text-slate-500 cursor-pointer ${
                                    isTargeted
                                      ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-400 shadow-xs'
                                      : 'border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: CART & CHECKOUT CONFIRMATION VIEW */}
        {/* ------------------------------------------------------------- */}
        {isCartPage && (
          <div className="space-y-3 bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Shopping Cart ({state.itemsInCart} Documents)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Index Only: Free County Retrieval ($0.00)
              </span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <div>
                      <span className="font-mono font-bold text-slate-800">{r.instrumentNumber}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-600 font-medium">{r.docType}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{r.recordingDate}</span>
                </div>
              ))}
            </div>

            {state.orderConfirmationId ? (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="inline-flex p-2 rounded-full bg-emerald-600 text-white shadow-xs">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-emerald-800">
                  Order Successfully Placed & Confirmed
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  Confirmation #: <span className="font-bold text-slate-900">{state.orderConfirmationId}</span>
                </div>
                <div className="pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Download All Documents Package
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold text-white shadow-xs cursor-pointer ${
                    state.currentStep === 'STEP_PLACE_ORDER'
                      ? 'bg-blue-600 ring-2 ring-blue-400 animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <span>Place Your Order</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OVERLAYS: ACTION MENU POPOVER */}
        {/* ------------------------------------------------------------- */}
        {state.currentViewportState.popoverOpen && (
          <div className="absolute top-1/2 right-8 z-20 bg-white border border-slate-300 rounded-lg shadow-xl p-1.5 w-44 text-xs animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
              Record Actions
            </div>
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 rounded text-white font-bold bg-blue-600 flex items-center gap-2 ring-2 ring-blue-400 shadow-xs mt-1"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add to Cart</span>
            </button>
            <div className="px-2 py-1 text-slate-500 text-[11px]">View Details</div>
            <div className="px-2 py-1 text-slate-500 text-[11px]">Print Preview</div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* OVERLAYS: ADD TO CART CONFIRMATION MODAL */}
        {/* ------------------------------------------------------------- */}
        {state.currentViewportState.modalOpen && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4 z-30 animate-in fade-in">
            <div className="bg-white rounded-lg border border-slate-200 p-4 max-w-sm w-full shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                  Add Document to Cart
                </h4>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  Confirm adding official document <span className="font-mono font-bold text-slate-900">#{activeRecord?.instrumentNumber}</span> to your retrieval package?
                </p>
                <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono">
                  <div>Type: {activeRecord?.docType}</div>
                  <div>Book/Page: {activeRecord?.bookPage}</div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1 text-xs font-bold rounded bg-blue-600 text-white ring-2 ring-blue-400 shadow-xs"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Viewport Footer Telemetry Bar */}
      <div className="bg-slate-900 border-t border-slate-700 px-3 py-1.5 text-[10px] font-mono text-slate-300 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="truncate">Active Locator: <span className="text-white">{state.activeSelector || 'None'}</span></span>
        </div>
        <span className="text-[10px] text-slate-400 shrink-0">FPS: 60 • Playwright CDP</span>
      </div>
    </div>
  );
};
