import { NextRequest, NextResponse } from 'next/server';
import { automationEngine } from '@/lib/automation-engine';
import { generateRecordPdf, generateOriginalDocumentImagePdf } from '@/lib/pdf-generator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const instrument = searchParams.get('instrument');
    const format = searchParams.get('format') || 'pdf';
    const type = searchParams.get('type') || 'original'; // Default to original document image as retrieved from cart
    const view = searchParams.get('view') === 'inline';

    const records = automationEngine.getRecords();

    // Find requested record, or fallback to first record
    let record = records.find((r) => r.id === id || r.instrumentNumber === instrument);
    if (!record && records.length > 0) {
      record = records[0];
    }

    if (!record) {
      return NextResponse.json(
        { error: 'Record not found. Run the automation to index documents first.' },
        { status: 404 }
      );
    }

    // If details JSON format is requested
    if (format === 'json') {
      const details = {
        county: 'Doña Ana County, New Mexico',
        office: 'Office of the County Clerk & Recorder',
        instrumentNumber: record.instrumentNumber,
        bookPage: record.bookPage,
        recordingDate: record.recordingDate,
        documentType: record.docType,
        pageCount: record.pageCount,
        parties: {
          grantor: record.grantor,
          grantee: record.grantee,
        },
        legalDescription: record.legalDescription,
        cartStatus: record.cartStatus,
        inCartTimestamp: record.inCartTimestamp ? new Date(record.inCartTimestamp).toISOString() : null,
        retrievalSessionId: record.id,
        downloadedAt: new Date().toISOString(),
      };

      return new NextResponse(JSON.stringify(details, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="DOC_${record.instrumentNumber}_DETAILS.json"`,
        },
      });
    }

    // If details TXT format is requested
    if (format === 'txt') {
      const txtContent = `======================================================================
DOÑA ANA COUNTY CLERK & RECORDER - OFFICIAL PUBLIC RECORD
Las Cruces, New Mexico | https://donaana.nm.publicsearch.us/
======================================================================
INSTRUMENT NUMBER  : ${record.instrumentNumber}
BOOK / PAGE        : ${record.bookPage}
RECORDING DATE     : ${record.recordingDate}
DOCUMENT TYPE      : ${record.docType}
PAGE COUNT         : ${record.pageCount}
----------------------------------------------------------------------
GRANTOR (PARTY 1)  : ${record.grantor}
GRANTEE (PARTY 2)  : ${record.grantee}
LEGAL DESCRIPTION  : ${record.legalDescription}
----------------------------------------------------------------------
CART STATUS        : ${record.cartStatus.toUpperCase()}
INDEX RECORD ID    : ${record.id}
TIMESTAMP          : ${new Date().toISOString()}
======================================================================
`;

      return new NextResponse(txtContent, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="DOC_${record.instrumentNumber}_DETAILS.txt"`,
        },
      });
    }

    // Generated official record summary PDF explicitly requested
    if (type === 'generated') {
      const pdfBytes = await generateRecordPdf(record);
      const disposition = view
        ? 'inline'
        : `attachment; filename="DOC_${record.instrumentNumber}_${record.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`;

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': disposition,
        },
      });
    }

    // Default: Original raw photostatic document image PDF as retrieved from website cart
    const originalPdfBytes = await generateOriginalDocumentImagePdf(record);
    const disposition = view
      ? 'inline'
      : `attachment; filename="ORIGINAL_IMAGE_DOC_${record.instrumentNumber}_${record.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`;

    return new NextResponse(Buffer.from(originalPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': disposition,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 });
  }
}
