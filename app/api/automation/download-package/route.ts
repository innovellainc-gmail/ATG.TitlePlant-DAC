import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { automationEngine } from '@/lib/automation-engine';

export async function GET() {
  try {
    const records = automationEngine.getRecords();
    const state = automationEngine.getState();
    const config = automationEngine.getConfig();

    const zip = new JSZip();

    // 1. Add Summary Manifest
    const manifest = {
      titlePlantPackage: 'Doña Ana County Historical Public Records (1930)',
      county: 'Doña Ana County',
      state: 'New Mexico',
      portalUrl: config.portalUrl,
      generatedTimestamp: new Date().toISOString(),
      orderConfirmationId: state.orderConfirmationId || `ORD-${Date.now()}-SIM`,
      recordCount: records.length,
      searchRange: `${config.startDate} to ${config.endDate}`,
      files: records.map((r) => ({
        instrumentNumber: r.instrumentNumber,
        filename: `${r.instrumentNumber}_${r.docType.replace(/[^a-zA-Z0-9]/g, '_')}.txt`,
        docType: r.docType,
        recordingDate: r.recordingDate,
        grantor: r.grantor,
        grantee: r.grantee,
        legalDescription: r.legalDescription,
      })),
    };

    zip.file('INDEX_MANIFEST.json', JSON.stringify(manifest, null, 2));

    // 2. Add CSV Index
    const csvHeader = 'Instrument,BookPage,RecordingDate,DocType,Grantor,Grantee,LegalDescription,Pages\n';
    const csvRows = records
      .map(
        (r) =>
          `"${r.instrumentNumber}","${r.bookPage}","${r.recordingDate}","${r.docType}","${r.grantor}","${r.grantee}","${r.legalDescription}",${r.pageCount}`
      )
      .join('\n');
    zip.file('TITLE_PLANT_INDEX.csv', csvHeader + csvRows);

    // 3. Add Individual Document Index Cards / Mock OCR Transcripts
    const docsFolder = zip.folder('DOCUMENTS_INDEXED');
    records.forEach((rec) => {
      const docContent = `======================================================================
DOÑA ANA COUNTY CLERK & RECORDER - OFFICIAL PUBLIC RECORD
Las Cruces, New Mexico
======================================================================
INSTRUMENT NO.     : ${rec.instrumentNumber}
BOOK / PAGE        : ${rec.bookPage}
RECORDING DATE     : ${rec.recordingDate}
DOCUMENT TYPE      : ${rec.docType}
PAGE COUNT         : ${rec.pageCount}
----------------------------------------------------------------------
GRANTOR (PARTY 1)  : ${rec.grantor}
GRANTEE (PARTY 2)  : ${rec.grantee}
LEGAL DESCRIPTION  : ${rec.legalDescription}
----------------------------------------------------------------------
COUNTY JURISDICTION: Doña Ana County, State of New Mexico
INDEX ONLY STATUS  : VERIFIED & INGESTED INTO TITLE CART
AUTOMATION BATCH ID: ${state.runId}
======================================================================
`;
      docsFolder?.file(`${rec.instrumentNumber}_${rec.docType.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, docContent);
    });

    // 4. Add Readme
    zip.file(
      'README.txt',
      `DOÑA ANA COUNTY PUBLIC RECORDS BATCH RETRIEVAL PACKAGE\nPortal: ${config.portalUrl}\nTotal Records Ingested: ${records.length}\nDate Filter: ${config.startDate} - ${config.endDate}\nOrder ID: ${state.orderConfirmationId || 'DIRECT_RETRIEVAL'}\n`
    );

    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Dona_Ana_County_Documents_Package_1930_${Date.now()}.zip"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
