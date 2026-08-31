'use client';

import React, { useState } from 'react';
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
  Sparkles,
  ShieldCheck,
  Printer,
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
  const [viewerTab, setViewerTab] = useState<'document' | 'raw_pdf'>('document');
  const [zoomLevel, setZoomLevel] = useState(100);

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
                        href={`/api/automation/document-pdf?id=${rec.id}&type=generated`}
                        download={`DOC_${rec.instrumentNumber}_${rec.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold cursor-pointer transition-colors"
                        title="Download Generated Document PDF"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                        <span>PDF</span>
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 max-w-5xl w-full h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between px-5 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <FileImage className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">
                      Original Document Image — Inst #{viewingOriginalRecord.instrumentNumber}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {viewingOriginalRecord.docType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Book/Page: {viewingOriginalRecord.bookPage} • Recorded: {viewingOriginalRecord.recordingDate}
                  </p>
                </div>
              </div>

              {/* Viewer Mode & Actions */}
              <div className="flex items-center gap-2">
                {/* View switcher tabs */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setViewerTab('document')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      viewerTab === 'document'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Original Ledger Image
                  </button>
                  <button
                    onClick={() => setViewerTab('raw_pdf')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      viewerTab === 'raw_pdf'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Browser PDF Stream
                  </button>
                </div>

                {viewerTab === 'document' && (
                  <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 px-1 py-0.5 text-xs text-slate-300">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-1.5 text-[10px] font-mono font-bold text-amber-400">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                      className="p-1 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(100)}
                      className="p-1 hover:text-white cursor-pointer ml-0.5 border-l border-slate-700"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <a
                  href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original&view=inline`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  title="Open PDF directly in a new browser window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Tab</span>
                </a>

                <a
                  href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original`}
                  download={`ORIGINAL_IMAGE_DOC_${viewingOriginalRecord.instrumentNumber}_${viewingOriginalRecord.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
                  title="Download Original Document Image PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .PDF</span>
                </a>

                <button
                  onClick={() => setViewingOriginalRecord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-200/90 p-4 overflow-auto flex justify-center items-start relative">
              {viewerTab === 'document' ? (
                /* High-fidelity Photostatic Microfiche / County Record Image Sheet */
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="bg-[#f9f7f0] text-slate-900 w-full max-w-[780px] p-8 sm:p-10 shadow-2xl rounded border-2 border-stone-400 font-serif relative shrink-0 my-2 select-text"
                >
                  {/* Ledger Header Bar */}
                  <div className="bg-stone-900 text-stone-100 text-[10px] font-mono font-bold px-3 py-1 mb-4 flex items-center justify-between tracking-wide">
                    <span>DOÑA ANA COUNTY CLERK ARCHIVAL REPOSITORY</span>
                    <span>ORIGINAL SCANNED DOCUMENT IMAGE</span>
                    <span>INST #{viewingOriginalRecord.instrumentNumber}</span>
                  </div>

                  {/* Red Archival Filing Stamp */}
                  <div className="absolute top-16 right-8 sm:right-10 border-2 border-red-800 bg-red-50/70 p-2.5 text-red-900 w-52 font-sans rotate-[-1.5deg] shadow-xs">
                    <div className="text-[10px] font-black uppercase text-center tracking-wider border-b border-red-700 pb-0.5 mb-1">
                      FILED FOR RECORD
                    </div>
                    <div className="text-[9px] font-bold text-center leading-tight">DOÑA ANA COUNTY, NEW MEXICO</div>
                    <div className="text-[8.5px] font-mono text-center my-0.5">DATE: {viewingOriginalRecord.recordingDate} AT 9:00 A.M.</div>
                    <div className="text-[9px] font-mono font-bold text-slate-950 text-center">INST. NO: {viewingOriginalRecord.instrumentNumber}</div>
                    <div className="text-[8.5px] font-mono text-center">BOOK & PAGE: {viewingOriginalRecord.bookPage}</div>
                    <div className="text-[7.5px] text-center font-bold text-red-800 mt-1 uppercase">County Clerk & Ex-Officio Recorder</div>
                  </div>

                  {/* Ledger Title */}
                  <div className="pr-56 mb-6">
                    <p className="text-[10px] font-mono font-bold text-stone-600 uppercase">
                      RECORD OF OFFICIAL INSTRUMENTS — STATE OF NEW MEXICO
                    </p>
                    <h2 className="text-2xl font-black tracking-tight text-stone-900 uppercase mt-1">
                      {viewingOriginalRecord.docType}
                    </h2>
                    <p className="text-xs font-mono text-stone-700 mt-1">
                      Recorded in: <strong className="text-stone-900">{viewingOriginalRecord.bookPage}</strong>
                    </p>
                  </div>

                  {/* Document Legal Text Body */}
                  <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-stone-900 border-t border-stone-300 pt-4 font-serif">
                    <p>
                      <strong>THIS INDENTURE</strong>, made and entered into this <strong>{viewingOriginalRecord.recordingDate}</strong>, by and between{' '}
                      <span className="font-bold underline decoration-stone-400">{viewingOriginalRecord.grantor}</span>, party of the first part, and{' '}
                      <span className="font-bold underline decoration-stone-400">{viewingOriginalRecord.grantee}</span>, party of the second part, both of the County of Doña Ana and State of New Mexico;
                    </p>

                    <p>
                      <strong>WITNESSETH:</strong> That the said party of the first part, for and in consideration of the sum of Ten Dollars ($10.00) and other good and valuable consideration to them in hand paid by the said party of the second part, receipt whereof is hereby confessed and acknowledged, have remised, released, sold, conveyed, and confirmed unto the said party of the second part, their heirs, executors, administrators, and assigns forever, all the following described real estate situated in Doña Ana County, State of New Mexico:
                    </p>

                    {/* Highlighted Legal Description Block */}
                    <div className="p-3.5 bg-stone-100/90 border border-stone-400 rounded font-mono text-xs text-stone-900 shadow-2xs my-2">
                      <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">Legal Description of Real Property:</span>
                      <p className="font-bold text-stone-950 text-sm">
                        &quot;{viewingOriginalRecord.legalDescription}&quot;
                      </p>
                    </div>

                    <p>
                      <strong>TOGETHER</strong> with all and singular the tenements, hereditaments, and appurtenances thereunto belonging or in anywise appertaining, and the reversion and reversions, remainder and remainders, rents, issues, and profits thereof; and all the estate, right, title, interest, claim, and demand whatsoever of the party of the first part.
                    </p>

                    <p>
                      <strong>TO HAVE AND TO HOLD</strong> the above-described premises unto the said party of the second part, their heirs, and assigns forever, free and clear from all former and other grants, bargains, sales, liens, taxes, assessments, and encumbrances.
                    </p>
                  </div>

                  {/* Signatures and Notary Section */}
                  <div className="mt-8 pt-6 border-t-2 border-stone-300 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Grantor Signature Line */}
                    <div className="space-y-4">
                      <p className="text-[11px] italic text-stone-700">IN WITNESS WHEREOF, the Grantor has signed and sealed:</p>
                      <div className="border-b-2 border-stone-800 pt-6"></div>
                      <p className="font-mono font-bold text-xs text-stone-900">
                        {viewingOriginalRecord.grantor} <span className="text-[10px] font-normal text-stone-600">[SEAL]</span>
                      </p>
                    </div>

                    {/* Notary Seal & Certificate */}
                    <div className="border border-stone-400 p-3 bg-stone-50 rounded text-[11px] relative">
                      <div className="font-bold text-stone-900 uppercase text-[9px] mb-1">State of New Mexico, County of Doña Ana, ss:</div>
                      <p className="text-[10.5px] leading-snug text-stone-800">
                        On this {viewingOriginalRecord.recordingDate}, before me personally appeared {viewingOriginalRecord.grantor}, known to me to be the person described in and who executed the foregoing instrument.
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <div className="border-b border-stone-700 w-28"></div>
                          <span className="text-[8.5px] text-stone-600 font-sans font-bold">Notary Public</span>
                        </div>
                        {/* Circular Notary Seal */}
                        <div className="w-12 h-12 rounded-full border-2 border-blue-900 flex flex-col items-center justify-center text-[7px] font-bold text-blue-900 uppercase rotate-12">
                          <span>NOTARY</span>
                          <span>SEAL</span>
                          <span className="text-[5.5px]">DONA ANA</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="mt-8 pt-3 border-t border-stone-300 flex items-center justify-between text-[9px] font-mono text-stone-500">
                    <span>PUBLICSEARCH.US DOÑA ANA COUNTY CLERK ARCHIVE</span>
                    <span>PAGE 1 OF {viewingOriginalRecord.pageCount}</span>
                    <span>CART EXPORT CERTIFIED</span>
                  </div>
                </div>
              ) : (
                /* Raw PDF fallback frame with Edge sandbox helper */
                <div className="w-full h-full flex flex-col">
                  <div className="p-2 mb-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center justify-between">
                    <span>
                      <strong>Notice for Microsoft Edge:</strong> If your browser blocks embedded PDF rendering inside iframes, click <strong>&quot;New Tab&quot;</strong> or switch back to the <strong>&quot;Original Ledger Image&quot;</strong> tab above.
                    </span>
                    <a
                      href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original&view=inline`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer ml-2 shrink-0"
                    >
                      Open Stream in New Tab
                    </a>
                  </div>
                  <iframe
                    src={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original&view=inline`}
                    className="w-full flex-1 rounded border border-slate-300 bg-white shadow-inner"
                    title={`Original Document Image - ${viewingOriginalRecord.instrumentNumber}`}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Source:</span>
                <span>Doña Ana County Clerk & Recorder Cart Public Record Image</span>
                <span className="text-slate-300">•</span>
                <span>Instrument #{viewingOriginalRecord.instrumentNumber}</span>
                <span className="text-slate-300">•</span>
                <span>{viewingOriginalRecord.pageCount} Page(s)</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/automation/document-pdf?id=${viewingOriginalRecord.id}&type=original`}
                  download={`ORIGINAL_IMAGE_DOC_${viewingOriginalRecord.instrumentNumber}_${viewingOriginalRecord.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  Export .PDF File
                </a>
                <button
                  onClick={() => setViewingOriginalRecord(null)}
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
