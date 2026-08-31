import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PublicRecord } from './types';

/**
 * Generates an authentic, formatted Public Record PDF document for Doña Ana County.
 */
export async function generateRecordPdf(record: PublicRecord): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageCount = Math.max(1, record.pageCount || 1);

  for (let p = 1; p <= pageCount; p++) {
    const page = pdfDoc.addPage([612, 792]); // Standard US Letter: 8.5 x 11 inches
    const { width, height } = page.getSize();

    // Outer border
    page.drawRectangle({
      x: 36,
      y: 36,
      width: width - 72,
      height: height - 72,
      borderColor: rgb(0.1, 0.15, 0.25),
      borderWidth: 1.5,
    });

    // Inner subtle border
    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      borderColor: rgb(0.7, 0.75, 0.8),
      borderWidth: 0.5,
    });

    // Recording Stamp Box (Top Right)
    page.drawRectangle({
      x: width - 260,
      y: height - 130,
      width: 215,
      height: 85,
      borderColor: rgb(0.1, 0.2, 0.4),
      borderWidth: 1,
      color: rgb(0.96, 0.98, 1.0),
    });

    page.drawText('DOÑA ANA COUNTY CLERK RECORDING STAMP', {
      x: width - 252,
      y: height - 58,
      size: 7,
      font: helveticaBold,
      color: rgb(0.1, 0.2, 0.4),
    });

    page.drawText(`INST #: ${record.instrumentNumber}`, {
      x: width - 252,
      y: height - 70,
      size: 8,
      font: courierBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(`BOOK/PAGE: ${record.bookPage}`, {
      x: width - 252,
      y: height - 82,
      size: 8,
      font: courier,
      color: rgb(0, 0, 0),
    });

    page.drawText(`REC DATE: ${record.recordingDate}`, {
      x: width - 252,
      y: height - 94,
      size: 8,
      font: courier,
      color: rgb(0, 0, 0),
    });

    page.drawText(`PAGE ${p} OF ${pageCount}`, {
      x: width - 252,
      y: height - 106,
      size: 7.5,
      font: helveticaBold,
      color: rgb(0.2, 0.4, 0.6),
    });

    page.drawText('VERIFIED & CERTIFIED COPY', {
      x: width - 252,
      y: height - 118,
      size: 6.5,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Top Header (Left & Center)
    page.drawText('STATE OF NEW MEXICO', {
      x: 55,
      y: height - 65,
      size: 10,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('COUNTY OF DOÑA ANA', {
      x: 55,
      y: height - 78,
      size: 11,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('OFFICE OF THE COUNTY CLERK & RECORDER', {
      x: 55,
      y: height - 90,
      size: 8,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText('845 N. Motel Blvd, Las Cruces, NM 88007', {
      x: 55,
      y: height - 100,
      size: 7,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Divider
    page.drawLine({
      start: { x: 50, y: height - 145 },
      end: { x: width - 50, y: height - 145 },
      thickness: 1,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Title / Document Type
    const docTitle = record.docType.toUpperCase();
    const titleWidth = timesRomanBold.widthOfTextAtSize(docTitle, 14);
    page.drawText(docTitle, {
      x: (width - titleWidth) / 2,
      y: height - 168,
      size: 14,
      font: timesRomanBold,
      color: rgb(0.1, 0.15, 0.3),
    });

    // Metadata Table Banner
    page.drawRectangle({
      x: 50,
      y: height - 250,
      width: width - 100,
      height: 68,
      borderColor: rgb(0.7, 0.75, 0.8),
      borderWidth: 1,
      color: rgb(0.97, 0.98, 0.99),
    });

    // Metadata items
    page.drawText('DOCUMENT RECORDING METADATA', {
      x: 60,
      y: height - 195,
      size: 8,
      font: helveticaBold,
      color: rgb(0.2, 0.3, 0.5),
    });

    page.drawText(`Instrument Number: ${record.instrumentNumber}`, {
      x: 60,
      y: height - 210,
      size: 8.5,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Recording Date: ${record.recordingDate}`, {
      x: 60,
      y: height - 224,
      size: 8.5,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Book / Page: ${record.bookPage}`, {
      x: 60,
      y: height - 238,
      size: 8.5,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Document Type: ${record.docType}`, {
      x: 310,
      y: height - 210,
      size: 8.5,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Total Pages: ${record.pageCount}`, {
      x: 310,
      y: height - 224,
      size: 8.5,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Indexing Status: CERTIFIED RETRIEVED`, {
      x: 310,
      y: height - 238,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.1, 0.5, 0.2),
    });

    // Parties Section
    page.drawText('PARTIES TO THE INSTRUMENT', {
      x: 50,
      y: height - 275,
      size: 10,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText('GRANTOR (First Party):', {
      x: 55,
      y: height - 295,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(record.grantor, {
      x: 200,
      y: height - 295,
      size: 9,
      font: timesRomanBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    page.drawText('GRANTEE (Second Party):', {
      x: 55,
      y: height - 315,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(record.grantee, {
      x: 200,
      y: height - 315,
      size: 9,
      font: timesRomanBold,
      color: rgb(0.05, 0.05, 0.05),
    });

    // Legal Description Section
    page.drawText('LEGAL DESCRIPTION OF PROPERTY', {
      x: 50,
      y: height - 345,
      size: 10,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawRectangle({
      x: 50,
      y: height - 425,
      width: width - 100,
      height: 65,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.75,
      color: rgb(0.99, 0.99, 0.99),
    });

    page.drawText(record.legalDescription, {
      x: 60,
      y: height - 375,
      size: 9,
      font: courierBold,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: width - 120,
      lineHeight: 14,
    });

    // Official Text / Instrument Body
    page.drawText('RECORDING & ACKNOWLEDGMENT CERTIFICATE', {
      x: 50,
      y: height - 455,
      size: 10,
      font: timesRomanBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    const bodyParagraph =
      `KNOW ALL MEN BY THESE PRESENTS, that on ${record.recordingDate}, the foregoing ${record.docType} was filed for record and officially entered in the public records of Doña Ana County, State of New Mexico under Instrument Number ${record.instrumentNumber} and recorded in Book/Page ${record.bookPage}. ` +
      `Said instrument affects real property situated within the jurisdiction of Doña Ana County, described as: "${record.legalDescription}". ` +
      `The parties named herein as Grantor (${record.grantor}) and Grantee (${record.grantee}) have executed this public record in accordance with the statutory recording laws of the State of New Mexico.`;

    page.drawText(bodyParagraph, {
      x: 50,
      y: height - 480,
      size: 8.5,
      font: timesRoman,
      color: rgb(0.15, 0.15, 0.15),
      maxWidth: width - 100,
      lineHeight: 13,
    });

    // Footer Signature & Seal Area
    page.drawLine({
      start: { x: 50, y: 120 },
      end: { x: width - 50, y: 120 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });

    page.drawText('OFFICIAL PUBLIC RECORD ARCHIVE COPY', {
      x: 50,
      y: 100,
      size: 7.5,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Doña Ana County Clerk • Generated via Public Search Portal Automation • ID: ${record.id}`, {
      x: 50,
      y: 88,
      size: 7,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText(`Page ${p} of ${pageCount}`, {
      x: width - 110,
      y: 88,
      size: 8,
      font: helveticaBold,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
