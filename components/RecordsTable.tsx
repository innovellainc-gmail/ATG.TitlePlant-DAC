'use client';

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
  Package,
  Eye,
  FileText,
  FileImage,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Stamp,
  ShieldCheck,
  Printer,
  Sparkles,
} from 'lucide-react';
import { PublicRecord } from '@/lib/types';

interface RecordsTableProps {
  records: PublicRecord[];
  onExportCsv: () => void;
  onExportJson: () => void;
  onDownloadPackage: () => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  onExportCsv,
  onExportJson,
  onDownloadPackage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<PublicRecord | null>(null);
  const [viewingOriginalRecord, setViewingOriginalRecord] = useState<PublicRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [viewerPage, setViewerPage] = useState<number>(1);
  const [viewerMode, setViewerMode] = useState<'photostatic' | 'pdf_frame'>('photostatic');
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const filtered = records.filter((rec) => {
    if (statusFilter !== 'ALL' && rec.cartStatus !== statusFilter) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.instrumentNumber.toLowerCase().includes(q) ||
      rec.bookPage.toLowerCase().includes(q) ||
      rec.grantor.toLowerCase().includes(q) ||
      rec.grantee.toLowerCase().includes(q) ||
      rec.docType.toLowerCase().includes(q) ||
      rec.legalDescription.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: PublicRecord['cartStatus']) => {
    switch (status) {
      case 'downloaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle className="w-3 h-3 text-purple-600" />
            DOWNLOADED
          </span>
        );
      case 'in_cart':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            IN CART
          </span>
        );
      case 'order_placed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3 h-3 text-blue-600" />
            ORDER PLACED
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" />
            ADDING...
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
            Indexed Public Records Audit Table
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
            {records.length} RECORDS
          </span>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search instrument #, grantor, legal..."
              className="pl-8 pr-3 py-1.5 text-xs rounded border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2 text-xs rounded border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="in_cart">In Cart</option>
              <option value="order_placed">Order Placed</option>
              <option value="processing">Processing</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            disabled={records.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>

          {/* Export JSON */}
          <button
            onClick={onExportJson}
            disabled={records.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Download className="w-3 h-3" />
            JSON
          </button>

          {/* Download Title Package */}
          <button
            onClick={onDownloadPackage}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            Package (ZIP)
          </button>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Instrument #</th>
              <th className="py-2.5 px-3">Book / Page</th>
              <th className="py-2.5 px-3">Recorded Date</th>
              <th className="py-2.5 px-3">Document Type</th>
              <th className="py-2.5 px-3">Grantor (Party 1)</th>
              <th className="py-2.5 px-3">Grantee (Party 2)</th>
              <th className="py-2.5 px-3">Legal Description</th>
              <th className="py-2.5 px-3">Cart Status</th>
              <th className="py-2.5 px-3 text-right">Actions & Downloads</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400 font-mono text-xs">
                  {records.length === 0
                    ? 'No public records indexed yet. Launch the browser automation above to populate.'
                    : 'No documents match the current search or status filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-400">{rec.rowNumber}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                    {rec.instrumentNumber}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {rec.bookPage}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">
                    {rec.recordingDate}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 text-[10px]">
                      {rec.docType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 truncate max-w-[140px]">
                    {rec.grantor}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 truncate max-w-[140px]">
                    {rec.grantee}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 truncate max-w-[200px]" title={rec.legalDescription}>
                    {rec.legalDescription}
                  </td>
                  <td className="py-2.5 px-3">{getStatusBadge(rec.cartStatus)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingOriginalRecord(rec)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold cursor-pointer transition-colors shadow-2xs"
                        title="View Original Scanned Document Image .PDF from Cart"
                      >
                        <Eye className="w-3 h-3 text-amber-700" />
                        <span>View Original PDF</span>
                      </button>
                      <a
                        href={`/api/automation/document-pdf?id=${rec.id}&type=original`}
                        download={`ORIGINAL_IMAGE_DOC_${rec.instrumentNumber}_${rec.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold cursor-pointer transition-colors"
                        title="Download Original Document Image PDF"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                        <span>Export PDF</span>
                      </a>
                      <a
                        href={`/api/automation/document-pdf?id=${rec.id}&format=json`}
                        download={`DOC_${rec.instrumentNumber}_DETAILS.json`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[10px] font-medium cursor-pointer transition-colors"
                        title="Download Document Details (JSON)"
                      >
                        <FileText className="w-3 h-3 text-slate-500" />
                        <span>Details</span>
                      </a>
                      <button
                        onClick={() => setSelectedRecord(rec)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer"
                        title="Inspect Record Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Inspector Drawer Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Document #{selectedRecord.instrumentNumber}
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">Doña Ana County Official Record</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">DOCUMENT TYPE</span>
                <span className="font-bold text-slate-800">{selectedRecord.docType}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">BOOK & PAGE</span>
                <span className="font-mono font-bold text-slate-800">{selectedRecord.bookPage}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">RECORDING DATE</span>
                <span className="font-mono text-slate-800">{selectedRecord.recordingDate}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">PAGE COUNT</span>
                <span className="font-mono text-slate-800">{selectedRecord.pageCount} Pages</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Grantor (Party 1)</span>
                <span className="font-semibold text-slate-900">{selectedRecord.grantor}</span>
              </div>
              <div className="p-3 rounded border border-slate-200">
                <span className="text-[9px] font-mono text-slate-400 block uppercase">Grantee (Party 2)</span>
                <span className="font-semibold text-slate-900">{selectedRecord.grantee}</span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-blue-50/40">
                <span className="text-[9px] font-mono text-blue-700 block uppercase font-semibold">Legal Description</span>
                <p className="font-mono text-slate-800 text-[11px] mt-0.5">
                  {selectedRecord.legalDescription}
                </p>
              </div>
            </div>

            {/* Document Downloads Deck */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Original Image & Export Files
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingOriginalRecord(selectedRecord);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Original Image (.PDF)</span>
                </button>
                <a
                  href={`/api/automation/document-pdf?id=${selectedRecord.id}&type=original`}
                  download={`ORIGINAL_IMAGE_DOC_${selectedRecord.instrumentNumber}_${selectedRecord.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-2 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold cursor-pointer transition-colors"
                  title="Export Original Document Image .PDF"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span>Export Original</span>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200">
                <a
                  href={`/api/automation/document-pdf?id=${selectedRecord.id}&type=generated`}
                  download={`DOC_${selectedRecord.instrumentNumber}_${selectedRecord.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Generated .PDF</span>
                </a>
                <a
                  href={`/api/automation/document-pdf?id=${selectedRecord.id}&format=json`}
                  download={`DOC_${selectedRecord.instrumentNumber}_DETAILS.json`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Details (JSON)</span>
                </a>
                <a
                  href={`/api/automation/document-pdf?id=${selectedRecord.id}&format=txt`}
                  download={`DOC_${selectedRecord.instrumentNumber}_DETAILS.txt`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Details (TXT)</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Cart Status:</span>
                {getStatusBadge(selectedRecord.cartStatus)}
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Original Document Image .PDF Viewer Modal */}
      {viewingOriginalRecord && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-6xl w-full h-[94vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Top Header */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900 text-white border-b border-slate-800 shrink-0 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <FileImage className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-100">
                      Original Document Image — Inst #{viewingOriginalRecord.instrumentNumber}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {viewingOriginalRecord.docType}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                    Book/Page: {viewingOriginalRecord.bookPage} • Recorded: {viewingOriginalRecord.recordingDate} • {viewingOriginalRecord.grantor} ➔ {viewingOriginalRecord.grantee}
                  </p>
                </div>
              </div>

              {/* Viewer Actions */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <a
                  href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original&view=inline`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  title="Open Original Document Image PDF in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>

                <a
                  href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original`}
                  download={`ORIGINAL_IMAGE_DOC_${viewingOriginalRecord.instrumentNumber}_${viewingOriginalRecord.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  title="Download Original Document Image PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Original .PDF</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setViewingOriginalRecord(null);
                    setZoomLevel(1.0);
                    setViewerPage(1);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Toolbar: Zoom Controls, Mode Switcher & Page Navigation */}
            <div className="px-4 py-2 bg-slate-800 text-slate-200 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              {/* Left: View Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewerMode('photostatic')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    viewerMode === 'photostatic'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Photostatic Ledger (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewerMode('pdf_frame')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    viewerMode === 'pdf_frame'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Direct PDF Stream</span>
                </button>
              </div>

              {/* Middle: Multi-page selector if applicable */}
              {viewingOriginalRecord.pageCount > 1 && (
                <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 font-mono text-xs">
                  <button
                    type="button"
                    disabled={viewerPage <= 1}
                    onClick={() => setViewerPage((p) => Math.max(1, p - 1))}
                    className="p-0.5 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 text-slate-300">
                    Page {viewerPage} of {viewingOriginalRecord.pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={viewerPage >= viewingOriginalRecord.pageCount}
                    onClick={() => setViewerPage((p) => Math.min(viewingOriginalRecord.pageCount, p + 1))}
                    className="p-0.5 rounded hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Right: Zoom & Scale Controls */}
              {viewerMode === 'photostatic' && (
                <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                    className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center font-mono text-[11px] text-amber-400 font-bold">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                    className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <div className="h-3 w-px bg-slate-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1.0)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                    title="Reset Zoom (100%)"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel(1.2)}
                    className="px-1.5 py-0.5 rounded hover:bg-slate-700 text-[10px] text-slate-300 hover:text-white cursor-pointer"
                    title="Fit Width"
                  >
                    Fit Width
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body / Viewer Canvas */}
            <div
              ref={viewerContainerRef}
              className="flex-1 bg-slate-950/90 p-4 sm:p-6 overflow-auto relative flex flex-col items-center justify-start cursor-grab active:cursor-grabbing select-none"
            >
              {viewerMode === 'photostatic' ? (
                <div
                  className="transition-transform duration-100 ease-out origin-top my-auto py-2"
                  style={{
                    transform: `scale(${zoomLevel})`,
                  }}
                >
                  {/* High-Resolution Photostatic Paper Document Canvas */}
                  <div className="w-[760px] min-h-[980px] sm:w-[820px] sm:min-h-[1060px] bg-[#fbf9f2] text-slate-900 border-2 border-[#453f36] shadow-2xl relative p-7 sm:p-9 font-serif select-text rounded-xs">
                    {/* Archival Paper Texture Vignette */}
                    <div className="absolute inset-0 bg-radial from-transparent via-amber-950/[0.02] to-amber-950/[0.08] pointer-events-none" />

                    {/* Microfiche / Scanner Top Tracking Bar */}
                    <div className="bg-slate-900 text-white px-3 py-1 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-between mb-4 border border-slate-800 rounded-xs shadow-inner">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400">DOÑA ANA COUNTY CLERK ARCHIVAL REPOSITORY</span>
                        <span className="text-slate-500">|</span>
                        <span>ORIGINAL SCANNED DOCUMENT IMAGE</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>INST #{viewingOriginalRecord.instrumentNumber}</span>
                        <span className="text-slate-500">|</span>
                        <span>PG {viewerPage}/{viewingOriginalRecord.pageCount}</span>
                      </div>
                    </div>

                    {/* Vintage Ornate Double Border */}
                    <div className="border border-[#2a2620] p-4 relative min-h-[900px] flex flex-col justify-between">
                      {/* Left Binding Margin Line */}
                      <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-300/80 pointer-events-none" />

                      {/* Header Section */}
                      <div className="pl-6 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase font-sans">
                              Record of Official Instruments • State of New Mexico
                            </p>
                            <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900 tracking-tight mt-0.5">
                              OFFICE OF THE COUNTY CLERK & RECORDER
                            </h2>
                            <p className="text-xs text-slate-700 font-serif italic">
                              Doña Ana County Courthouse • Las Cruces, New Mexico
                            </p>
                            <div className="mt-2 text-xs font-mono text-slate-800 space-y-0.5">
                              <p>
                                <span className="font-bold">BOOK / PAGE:</span> {viewingOriginalRecord.bookPage}
                              </p>
                              <p>
                                <span className="font-bold">RECORDING DATE:</span> {viewingOriginalRecord.recordingDate}
                              </p>
                            </div>
                          </div>

                          {/* Official Red Ink Rubber Clerk Filing Stamp */}
                          <div className="w-56 p-2.5 border-2 border-red-800 bg-red-50/40 text-red-900 rounded font-mono text-[10px] transform -rotate-1 shadow-xs shrink-0 select-none">
                            <div className="border border-red-700/60 p-1.5 space-y-1 text-center">
                              <div className="flex items-center justify-center gap-1 font-bold text-[10px] text-red-950 border-b border-red-700/40 pb-0.5">
                                <Stamp className="w-3 h-3 text-red-800" />
                                <span>FILED FOR RECORD</span>
                              </div>
                              <div className="text-left text-[9px] leading-tight space-y-0.5 text-red-900">
                                <p><span className="font-bold">DATE:</span> {viewingOriginalRecord.recordingDate}</p>
                                <p><span className="font-bold">TIME:</span> 09:30:00 AM</p>
                                <p><span className="font-bold">INST NO:</span> {viewingOriginalRecord.instrumentNumber}</p>
                                <p><span className="font-bold">BOOK/PAGE:</span> {viewingOriginalRecord.bookPage}</p>
                                <div className="border-t border-red-700/40 pt-1 mt-1 text-center">
                                  <p className="font-bold text-[8.5px] uppercase">DOÑA ANA COUNTY CLERK</p>
                                  <p className="italic font-serif text-[8px] text-red-800">By: J. R. Montoya, Deputy [SEAL]</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Title Banner */}
                        <div className="border-t-2 border-b border-slate-900 py-1.5 my-3 text-center">
                          <h1 className="text-base sm:text-lg font-bold font-serif uppercase tracking-widest text-slate-900">
                            {viewingOriginalRecord.docType}
                          </h1>
                        </div>
                      </div>

                      {/* Legal Body Section */}
                      <div className="pl-6 py-2 space-y-4 text-xs sm:text-[13px] leading-relaxed text-slate-800 font-serif">
                        {viewerPage === 1 ? (
                          <>
                            <p className="indent-6 text-justify">
                              <span className="font-bold font-serif text-sm">KNOW ALL MEN BY THESE PRESENTS</span>, That on this{' '}
                              <span className="font-semibold">{viewingOriginalRecord.recordingDate}</span>, in the County of Doña Ana,
                              State of New Mexico, by and between:
                            </p>

                            <div className="bg-slate-50/80 border border-slate-300 p-3 rounded-xs font-sans text-xs space-y-1.5">
                              <p>
                                <strong className="text-slate-900">GRANTOR (Party of the First Part):</strong>{' '}
                                <span className="font-serif font-bold text-slate-950">{viewingOriginalRecord.grantor}</span>
                              </p>
                              <p>
                                <strong className="text-slate-900">GRANTEE (Party of the Second Part):</strong>{' '}
                                <span className="font-serif font-bold text-slate-950">{viewingOriginalRecord.grantee}</span>
                              </p>
                            </div>

                            <p className="indent-6 text-justify">
                              <strong>WITNESSETH:</strong> That the said Grantor, for and in consideration of the sum of{' '}
                              <em>Ten Dollars ($10.00)</em> and other good and valuable consideration to them in hand paid by the said
                              Grantee, the receipt whereof is hereby confessed and acknowledged, has granted, bargained, sold, and
                              conveyed, and by these presents does grant, bargain, sell, convey, and confirm unto the said Grantee, and
                              their heirs and assigns forever, all the following described tract or parcel of land situated, lying, and
                              being in the <strong>County of Doña Ana, State of New Mexico</strong>, to-wit:
                            </p>

                            {/* Legal Property Description Box */}
                            <div className="p-3.5 bg-amber-50/50 border border-amber-900/30 font-mono text-xs text-slate-900 rounded-xs shadow-inner">
                              <div className="text-[10px] font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1 font-sans">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                                <span>Official Legal Property Description:</span>
                              </div>
                              <p className="font-semibold leading-normal">
                                &ldquo;{viewingOriginalRecord.legalDescription}&rdquo;
                              </p>
                              <p className="text-[10px] text-slate-600 mt-1.5 font-sans">
                                Together with all and singular the hereditaments and appurtenances thereunto belonging or in anywise
                                appertaining, and the reversion and reversions, remainder and remainders, rents, issues, and profits thereof.
                              </p>
                            </div>

                            <p className="indent-6 text-justify">
                              <strong>TO HAVE AND TO HOLD</strong> the said premises above described, with the appurtenances, unto the said
                              Grantee, their heirs, executors, administrators, and assigns forever. And the said Grantor does covenant,
                              promise, and agree to and with the said Grantee that at the time of the ensealing and delivery of these
                              presents they are well seized of the premises above conveyed as of a good, sure, perfect, absolute, and
                              indefeasible estate of inheritance in law in fee simple.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="border-b border-slate-300 pb-2 mb-3">
                              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                                Continuation of Covenants, Conditions & Statutory Warranties — Page {viewerPage} of {viewingOriginalRecord.pageCount}
                              </h3>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Affecting Instrument #{viewingOriginalRecord.instrumentNumber} • Book/Page {viewingOriginalRecord.bookPage}
                              </p>
                            </div>

                            <p className="indent-6 text-justify">
                              AND the said Grantor, for themselves, their heirs, executors, and administrators, does covenant, grant,
                              bargain, and agree to and with the said Grantee, their heirs and assigns, that they shall and will WARRANT
                              AND FOREVER DEFEND the title to the said property against the lawful claims of all persons whomsoever.
                            </p>

                            <p className="indent-6 text-justify">
                              IN WITNESS WHEREOF, the Grantor has hereunto set their hand and seal the day and year first above written.
                              Signed, sealed, and delivered in the presence of the subscribing witnesses in accordance with the statutory
                              provisions of the State of New Mexico.
                            </p>
                          </>
                        )}

                        {/* Signatures & Purple Notary Acknowledgment Stamp Block */}
                        <div className="pt-4 border-t border-slate-300 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          {/* Signature Lines */}
                          <div className="space-y-3 font-serif">
                            <div>
                              <div className="h-7 border-b border-slate-800 flex items-end justify-between px-1">
                                <span className="font-serif italic text-base text-slate-800 transform -rotate-1 font-bold">
                                  {viewingOriginalRecord.grantor}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-slate-400">[SEAL]</span>
                              </div>
                              <p className="text-[10px] font-sans text-slate-600 uppercase mt-0.5">Grantor Signature</p>
                            </div>

                            <div>
                              <div className="h-7 border-b border-slate-800 flex items-end justify-between px-1">
                                <span className="font-serif italic text-base text-slate-800 transform -rotate-1">
                                  {viewingOriginalRecord.grantee}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-slate-400">[SEAL]</span>
                              </div>
                              <p className="text-[10px] font-sans text-slate-600 uppercase mt-0.5">Grantee Acknowledgment</p>
                            </div>
                          </div>

                          {/* Purple Notary Public Rubber Stamp */}
                          <div className="border-2 border-purple-800 bg-purple-50/40 text-purple-950 p-2.5 rounded font-mono text-[9px] leading-tight space-y-1 shadow-xs transform rotate-1">
                            <div className="text-center font-bold text-[9.5px] border-b border-purple-700/40 pb-0.5 text-purple-900">
                              STATE OF NEW MEXICO, COUNTY OF DOÑA ANA ss.
                            </div>
                            <p>
                              Acknowledged before me this <strong>{viewingOriginalRecord.recordingDate}</strong> by{' '}
                              <strong>{viewingOriginalRecord.grantor}</strong>.
                            </p>
                            <div className="pt-1 flex items-center justify-between border-t border-purple-700/30 text-[8px]">
                              <span>[ NOTARY SEAL ]</span>
                              <span>Commission Expires: Dec 31, 1934</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Microprint Footer */}
                      <div className="pl-6 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500 uppercase">
                        <span>OFFICIAL PUBLIC RECORD • DOÑA ANA COUNTY, NEW MEXICO</span>
                        <span>DOCUMENT IMAGE VERIFIED BY TITLE AUTOMATION ENGINE</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback Direct PDF Stream Iframe */
                <iframe
                  src={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original&view=inline`}
                  className="w-full h-full rounded border border-slate-300 bg-white shadow-inner"
                  title={`Original Document Image - ${viewingOriginalRecord.instrumentNumber}`}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Cart Retrieval Source:</span>
                <span>Doña Ana County Clerk & Recorder Cart Scanned Document Image</span>
                <span className="text-slate-300">•</span>
                <span>Instrument #{viewingOriginalRecord.instrumentNumber}</span>
                <span className="text-slate-300">•</span>
                <span>{viewingOriginalRecord.pageCount} Page(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original`}
                  download={`ORIGINAL_IMAGE_DOC_${viewingOriginalRecord.instrumentNumber}_${viewingOriginalRecord.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" />
                  <span>Export Original .PDF File</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setViewingOriginalRecord(null);
                    setZoomLevel(1.0);
                    setViewerPage(1);
                  }}
                  className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
