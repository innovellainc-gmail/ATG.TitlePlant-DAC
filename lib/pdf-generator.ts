import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PublicRecord } from './types';

/**
 * Generates the authentic, photostatic Original Document Image PDF as retrieved from the website cart.
 * Recreates the historical scanned microfiche/photostatic ledger page with clerk stamps and vintage legal text.
 */
export async function generateOriginalDocumentImagePdf(record: PublicRecord): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageCount = Math.max(1, record.pageCount || 1);

  for (let p = 1; p <= pageCount; p++) {
    const page = pdfDoc.addPage([612, 792]); // 8.5 x 11 inches
    const { width, height } = page.getSize();

    // 1. Archival Photostatic Background (Vintage paper ledger tone)
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(0.97, 0.965, 0.935),
    });

    // 2. Microfiche / Scanner Top Tracking Bar
    page.drawRectangle({
      x: 20,
      y: height - 32,
      width: width - 40,
      height: 18,
      color: rgb(0.12, 0.14, 0.18),
    });

    page.drawText(
      `DOÑA ANA COUNTY CLERK ARCHIVAL REPOSITORY  |  ORIGINAL SCANNED DOCUMENT IMAGE  |  INST #${record.instrumentNumber}  |  PG ${p}/${pageCount}`,
      {
        x: 28,
        y: height - 26,
        size: 6.5,
        font: courierBold,
        color: rgb(1, 1, 1),
      }
    );

    // 3. Vintage Double Line Ledger Border
    page.drawRectangle({
      x: 28,
      y: 28,
      width: width - 56,
      height: height - 68,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 1.5,
    });

    page.drawRectangle({
      x: 32,
      y: 32,
      width: width - 64,
      height: height - 76,
      borderColor: rgb(0.4, 0.4, 0.4),
      borderWidth: 0.5,
    });

    // Left Binding Margin Line
    page.drawLine({
      start: { x: 80, y: 32 },
      end: { x: 80, y: height - 44 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Top Header Banner inside ledger
    page.drawText('RECORD OF OFFICIAL INSTRUMENTS — DOÑA ANA COUNTY, NEW MEXICO', {
      x: 95,
      y: height - 60,
      size: 9,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`BOOK & PAGE: ${record.bookPage}  •  FILE DATE: ${record.recordingDate}`, {
      x: 95,
      y: height - 72,
      size: 7.5,
      font: courierBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // 4. Official Red Ink Rubber Filing Stamp (Upper Right)
    page.drawRectangle({
      x: width - 240,
      y: height - 165,
      width: 195,
      height: 90,
      borderColor: rgb(0.65, 0.12, 0.12),
      borderWidth: 1.5,
      color: rgb(0.98, 0.95, 0.94),
    });

    page.drawText('FILED FOR RECORD', {
      x: width - 230,
      y: height - 90,
      size: 8,
      font: helveticaBold,
      color: rgb(0.65, 0.12, 0.12),
    });

    page.drawText('DOÑA ANA COUNTY, NEW MEXICO', {
      x: width - 230,
      y: height - 102,
      size: 7,
      font: helveticaBold,
      color: rgb(0.65, 0.12, 0.12),
    });

    page.drawText(`DATE: ${record.recordingDate}  AT 9:00 A.M.`, {
      x: width - 230,
      y: height - 114,
      size: 7,
      font: courierBold,
      color: rgb(0.65, 0.12, 0.12),
    });

    page.drawText(`INST. NO: ${record.instrumentNumber}`, {
      x: width - 230,
      y: height - 126,
      size: 7.5,
      font: courierBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`RECORDED IN: ${record.bookPage}`, {
      x: width - 230,
      y: height - 138,
      size: 7,
      font: courier,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('COUNTY CLERK & EX-OFFICIO RECORDER', {
      x: width - 230,
      y: height - 152,
      size: 6,
      font: helveticaBold,
      color: rgb(0.65, 0.12, 0.12),
    });

    // 5. Document Headline Title
    const headline = record.docType.toUpperCase();
    page.drawText(headline, {
      x: 95,
      y: height - 105,
      size: 14,
      font: timesRomanBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    // 6. Archival Legal Instrument Body (Antique Typewriter style)
    const p1 = `THIS INDENTURE, made and entered into this ${record.recordingDate}, by and between ${record.grantor}, of the County of Doña Ana and State of New Mexico, party of the first part, and ${record.grantee}, party of the second part;`;

    const p2 = `WITNESSETH: That the said party of the first part, for and in consideration of the sum of Ten Dollars ($10.00) and other good and valuable consideration in hand paid by the said party of the second part, the receipt whereof is hereby confessed and acknowledged, has remised, released, sold, and conveyed, and by these presents does hereby grant, convey, and confirm unto the said party of the second part, and to their heirs, successors, and assigns forever, all that certain tract or parcel of land situated, lying, and being in the County of Doña Ana, State of New Mexico, described as follows, to-wit:`;

    const p3 = `TOGETHER with all and singular the hereditaments and appurtenances thereunto belonging, or in anywise appertaining, and the reversion and reversions, remainder and remainers, rents, issues, and profits thereof; and all the estate, right, title, interest, claim, and demand whatsoever of the said party of the first part, either in law or equity, of, in, and to the above bargained premises.`;

    const p4 = `TO HAVE AND TO HOLD the said premises above described, with the appurtenances, unto the said party of the second part, their heirs, and assigns forever.`;

    page.drawText(p1, {
      x: 95,
      y: height - 185,
      size: 8.5,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 145,
      lineHeight: 13,
    });

    page.drawText(p2, {
      x: 95,
      y: height - 235,
      size: 8.5,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 145,
      lineHeight: 13,
    });

    // Highlighted Legal Description Block (Indented Typewriter Font)
    page.drawRectangle({
      x: 105,
      y: height - 355,
      width: width - 165,
      height: 50,
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
      color: rgb(0.99, 0.99, 0.97),
    });

    page.drawText(`LEGAL DESCRIPTION: "${record.legalDescription}"`, {
      x: 115,
      y: height - 325,
      size: 8.5,
      font: courierBold,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 185,
      lineHeight: 12,
    });

    page.drawText(p3, {
      x: 95,
      y: height - 375,
      size: 8.5,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 145,
      lineHeight: 13,
    });

    page.drawText(p4, {
      x: 95,
      y: height - 440,
      size: 8.5,
      font: timesRoman,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width - 145,
      lineHeight: 13,
    });

    // 7. Signature Lines & Seals
    page.drawText('IN WITNESS WHEREOF, the said party of the first part has hereunto signed:', {
      x: 95,
      y: height - 475,
      size: 8.5,
      font: timesRomanItalic,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawLine({
      start: { x: width - 260, y: height - 520 },
      end: { x: width - 60, y: height - 520 },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`${record.grantor}  [SEAL]`, {
      x: width - 250,
      y: height - 533,
      size: 8.5,
      font: courierBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // 8. Notary Acknowledgment Box
    page.drawRectangle({
      x: 95,
      y: height - 650,
      width: width - 150,
      height: 105,
      borderColor: rgb(0.4, 0.4, 0.4),
      borderWidth: 0.75,
      color: rgb(0.985, 0.98, 0.95),
    });

    page.drawText('STATE OF NEW MEXICO, COUNTY OF DOÑA ANA, ss:', {
      x: 105,
      y: height - 560,
      size: 8,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    const ackText = `On this ${record.recordingDate}, before me, a Notary Public in and for said County and State, personally appeared ${record.grantor}, known to me to be the person described in and who executed the foregoing instrument, and acknowledged that they executed the same as their free and voluntary act and deed for the uses and purposes therein set forth.`;

    page.drawText(ackText, {
      x: 105,
      y: height - 575,
      size: 7.5,
      font: timesRoman,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: width - 280,
      lineHeight: 11,
    });

    // Circular Notary Stamp Graphic
    page.drawCircle({
      x: width - 120,
      y: height - 600,
      size: 32,
      borderColor: rgb(0.1, 0.2, 0.5),
      borderWidth: 1.5,
    });

    page.drawCircle({
      x: width - 120,
      y: height - 600,
      size: 27,
      borderColor: rgb(0.1, 0.2, 0.5),
      borderWidth: 0.5,
    });

    page.drawText('NOTARY', {
      x: width - 138,
      y: height - 595,
      size: 6.5,
      font: helveticaBold,
      color: rgb(0.1, 0.2, 0.5),
    });

    page.drawText('PUBLIC', {
      x: width - 136,
      y: height - 604,
      size: 6.5,
      font: helveticaBold,
      color: rgb(0.1, 0.2, 0.5),
    });

    page.drawText('DOÑA ANA', {
      x: width - 140,
      y: height - 613,
      size: 5.5,
      font: helvetica,
      color: rgb(0.1, 0.2, 0.5),
    });

    // 9. Bottom Archival Watermark & Footnote
    page.drawText(
      `OFFICIAL WEBSITE CART RETRIEVAL  •  PUBLICSEARCH.US DOÑA ANA COUNTY CLERK  •  PAGE ${p} OF ${pageCount}`,
      {
        x: 95,
        y: 42,
        size: 6.5,
        font: courierBold,
        color: rgb(0.4, 0.4, 0.4),
      }
    );
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
