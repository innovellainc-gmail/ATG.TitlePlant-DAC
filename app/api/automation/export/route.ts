import { NextRequest, NextResponse } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const records = automationEngine.getRecords();
  const state = automationEngine.getState();
  const config = automationEngine.getConfig();

  if (format === 'json') {
    const data = {
      county: 'Doña Ana County, New Mexico',
      portalUrl: config.portalUrl,
      searchCriteria: {
        startDate: config.startDate,
        endDate: config.endDate,
        searchType: config.searchType,
      },
      executionSummary: {
        runId: state.runId,
        status: state.status,
        totalRecords: records.length,
        itemsInCart: state.itemsInCart,
        orderConfirmationId: state.orderConfirmationId,
        exportedAt: new Date().toISOString(),
      },
      records,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="dona_ana_records_${config.startDate.replace(/\//g, '-')}_to_${config.endDate.replace(/\//g, '-')}.json"`,
      },
    });
  }

  // CSV Format
  const headers = [
    'Row #',
    'Instrument Number',
    'Book / Page',
    'Recording Date',
    'Document Type',
    'Grantor',
    'Grantee',
    'Legal Description',
    'Page Count',
    'Cart Status',
    'Page #',
  ];

  const rows = records.map((r) => [
    r.rowNumber,
    `"${r.instrumentNumber}"`,
    `"${r.bookPage}"`,
    `"${r.recordingDate}"`,
    `"${r.docType}"`,
    `"${r.grantor.replace(/"/g, '""')}"`,
    `"${r.grantee.replace(/"/g, '""')}"`,
    `"${r.legalDescription.replace(/"/g, '""')}"`,
    r.pageCount,
    r.cartStatus,
    r.pageNumber,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dona_ana_records_1930_${Date.now()}.csv"`,
    },
  });
}
