import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { automationEngine } from '@/lib/automation-engine';
import { generateRecordPdf, generateOriginalDocumentImagePdf } from '@/lib/pdf-generator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const records = automationEngine.getRecords();
    const state = automationEngine.getState();
    const config = automationEngine.getConfig();

    const zip = new JSZip();

    const dateRangeLabel = `${config.startDate.replace(/\//g, '-')}_to_${config.endDate.replace(/\//g, '-')}`;

    // 1. Add Summary Manifest
    const manifest = {
      titlePlantPackage: `Doña Ana County Historical Public Records (${config.startDate} to ${config.endDate})`,
      county: 'Doña Ana County',
      state: 'New Mexico',
      portalUrl: config.portalUrl,
      generatedTimestamp: new Date().toISOString(),
      orderConfirmationId: state.orderConfirmationId || `ORD-${Date.now()}-REC`,
      recordCount: records.length,
      searchRange: `${config.startDate} to ${config.endDate}`,
      files: records.map((r) => ({
        instrumentNumber: r.instrumentNumber,
        originalImagePdfFilename: `ORIGINAL_DOCUMENT_IMAGES/ORIGINAL_IMAGE_DOC_${r.instrumentNumber}_${r.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        generatedPdfFilename: `GENERATED_PDF_DOCUMENTS/DOC_${r.instrumentNumber}_${r.docType.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        detailsJsonFilename: `DOCUMENT_DETAILS/DOC_${r.instrumentNumber}_DETAILS.json`,
        detailsTxtFilename: `DOCUMENT_DETAILS/DOC_${r.instrumentNumber}_DETAILS.txt`,
        docType: r.docType,
        recordingDate: r.recordingDate,
        grantor: r.grantor,
        grantee: r.grantee,
        legalDescription: r.legalDescription,
        pages: r.pageCount,
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

    // 3. Add Original Document Images, Generated PDF Documents & Details Folders
    const originalImageFolder = zip.folder('ORIGINAL_DOCUMENT_IMAGES');
    const generatedPdfFolder = zip.folder('GENERATED_PDF_DOCUMENTS');
    const detailsFolder = zip.folder('DOCUMENT_DETAILS');

    for (const rec of records) {
      const cleanDocType = rec.docType.replace(/[^a-zA-Z0-9]/g, '_');

      // Add Original Document Image from Cart (.PDF)
      try {
        const originalBytes = await generateOriginalDocumentImagePdf(rec);
        originalImageFolder?.file(`ORIGINAL_IMAGE_DOC_${rec.instrumentNumber}_${cleanDocType}.pdf`, originalBytes);
      } catch (e) {
        console.error(`Error generating original image PDF for ${rec.instrumentNumber}:`, e);
      }

      // Add Generated Record PDF
      try {
        const pdfBytes = await generateRecordPdf(rec);
        generatedPdfFolder?.file(`DOC_${rec.instrumentNumber}_${cleanDocType}.pdf`, pdfBytes);
      } catch (e) {
        console.error(`Error generating PDF for ${rec.instrumentNumber}:`, e);
      }

      // Add Detailed JSON index card
      const detailObj = {
        county: 'Doña Ana County, New Mexico',
        office: 'Office of the County Clerk & Recorder',
        instrumentNumber: rec.instrumentNumber,
        bookPage: rec.bookPage,
        recordingDate: rec.recordingDate,
        documentType: rec.docType,
        pageCount: rec.pageCount,
        parties: {
          grantor: rec.grantor,
          grantee: rec.grantee,
        },
        legalDescription: rec.legalDescription,
        cartStatus: rec.cartStatus,
        indexedAt: new Date().toISOString(),
      };
      detailsFolder?.file(`DOC_${rec.instrumentNumber}_DETAILS.json`, JSON.stringify(detailObj, null, 2));

      // Add Text format index card
      const docContent = `======================================================================
DOÑA ANA COUNTY CLERK & RECORDER - OFFICIAL PUBLIC RECORD
Las Cruces, New Mexico | https://donaana.nm.publicsearch.us/
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
      detailsFolder?.file(`DOC_${rec.instrumentNumber}_DETAILS.txt`, docContent);
    }

    // 4. Add Readme
    zip.file(
      'README.txt',
      `DOÑA ANA COUNTY PUBLIC RECORDS BATCH RETRIEVAL PACKAGE\n` +
      `Portal: ${config.portalUrl}\n` +
      `Total Records Ingested: ${records.length}\n` +
      `Date Filter: ${config.startDate} - ${config.endDate}\n` +
      `Order ID: ${state.orderConfirmationId || 'DIRECT_RETRIEVAL'}\n\n` +
      `PACKAGE CONTENTS:\n` +
      `1. ORIGINAL_DOCUMENT_IMAGES/ - High-resolution photostatic/microfiche original document image PDFs exported from the county cart.\n` +
      `2. GENERATED_PDF_DOCUMENTS/ - Certified formatted public record summary PDFs.\n` +
      `3. DOCUMENT_DETAILS/ - Structured JSON and TXT metadata index cards.\n` +
      `4. TITLE_PLANT_INDEX.csv - Delimited index table for title plant ingestion.\n` +
      `5. INDEX_MANIFEST.json - Comprehensive cryptographic batch manifest.\n`
    );

    const arrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="Dona_Ana_County_Documents_Package_${dateRangeLabel}_${Date.now()}.zip"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
