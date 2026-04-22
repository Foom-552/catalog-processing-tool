import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { ValidationResult } from '../types/catalog';

const SEV_COLORS: Record<string, string> = {
  ERROR: 'FFCCCC',
  WARNING: 'FFF3CC',
  INFO: 'CCE5FF',
  PASS: 'CCFFCC',
};

export async function generateExcelReport(validation: ValidationResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Catalog Processing Tool';
  wb.created = new Date();

  // ── Summary Sheet ──
  const summarySheet = wb.addWorksheet('Summary');
  summarySheet.columns = [{ width: 30 }, { width: 20 }];

  summarySheet.addRow(['Catalog Validation Report']).font = { bold: true, size: 14 };
  summarySheet.addRow([]);
  summarySheet.addRow(['Generated', new Date().toISOString()]);
  summarySheet.addRow(['Session ID', validation.sessionId]);
  summarySheet.addRow(['Total Items', validation.itemCount]);
  summarySheet.addRow(['Valid Items', validation.validItemCount]);
  summarySheet.addRow(['Errors', validation.errorCount]);
  summarySheet.addRow(['Warnings', validation.warningCount]);
  summarySheet.addRow(['Status', validation.passed ? 'PASSED' : 'FAILED']);

  const statusRow = summarySheet.lastRow!;
  statusRow.getCell(2).fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: validation.passed ? 'FF' + SEV_COLORS.PASS : 'FF' + SEV_COLORS.ERROR },
  };

  summarySheet.addRow([]);
  summarySheet.addRow(['Rule', 'Status', 'Affected Rows']).font = { bold: true };
  for (const r of validation.rulesSummary) {
    const row = summarySheet.addRow([r.ruleName, r.status, r.affectedRows]);
    const color = r.status === 'FAIL' ? SEV_COLORS.ERROR : r.status === 'WARN' ? SEV_COLORS.WARNING : SEV_COLORS.PASS;
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
  }

  // ── Issues Sheet ──
  const issuesSheet = wb.addWorksheet('Issues');
  issuesSheet.columns = [
    { header: 'Row #', width: 8 },
    { header: 'Severity', width: 12 },
    { header: 'Field', width: 25 },
    { header: 'Value', width: 30 },
    { header: 'Issue', width: 60 },
    { header: 'Rule Code', width: 25 },
  ];
  issuesSheet.getRow(1).font = { bold: true };

  for (const issue of validation.issues) {
    const row = issuesSheet.addRow([
      issue.rowNumber ?? 'Header',
      issue.severity,
      issue.field,
      issue.originalValue?.slice(0, 100),
      issue.message,
      issue.ruleCode,
    ]);
    const color = SEV_COLORS[issue.severity] ?? 'FFFFFF';
    for (let c = 1; c <= 6; c++) {
      row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } };
    }
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function generatePdfReport(validation: ValidationResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    doc.on('data', chunk => chunks.push(Buffer.from(chunk)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('Catalog Validation Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(0.5);

    // Status banner
    const statusColor = validation.passed ? '#28a745' : '#dc3545';
    doc.rect(40, doc.y, doc.page.width - 80, 30).fill(statusColor);
    doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
       .text(validation.passed ? '✓ PASSED' : '✗ FAILED', 40, doc.y - 25, { width: doc.page.width - 80, align: 'center' });
    doc.fillColor('black').moveDown(1);

    // Summary table
    doc.fontSize(11).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    const summaryItems = [
      ['Total Items', String(validation.itemCount)],
      ['Valid Items', String(validation.validItemCount)],
      ['Errors', String(validation.errorCount)],
      ['Warnings', String(validation.warningCount)],
    ];
    for (const [label, val] of summaryItems) {
      doc.fontSize(10).font('Helvetica').text(`${label}: `, { continued: true }).font('Helvetica-Bold').text(val);
    }
    doc.moveDown(1);

    // Issues table header
    if (validation.issues.length === 0) {
      doc.fontSize(11).font('Helvetica').fillColor('#28a745').text('No issues found — catalog is valid!');
    } else {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('black').text('Issues');
      doc.moveDown(0.3);

      const colWidths = [40, 60, 90, 90, 220];
      const headers = ['Row', 'Severity', 'Field', 'Value', 'Message'];
      let x = 40;
      doc.fontSize(9).font('Helvetica-Bold');
      headers.forEach((h, i) => { doc.text(h, x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 }); x += colWidths[i]; });
      doc.moveDown(0.3);
      doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
      doc.moveDown(0.2);

      for (const iss of validation.issues.slice(0, 500)) {
        if (doc.y > doc.page.height - 80) { doc.addPage(); }
        const color = iss.severity === 'ERROR' ? '#dc3545' : iss.severity === 'WARNING' ? '#856404' : '#0c5460';
        x = 40;
        doc.fontSize(8).font('Helvetica').fillColor(color);
        const row = [
          String(iss.rowNumber ?? 'Hdr'),
          iss.severity,
          iss.field.slice(0, 15),
          (iss.originalValue ?? '').slice(0, 20),
          iss.message.slice(0, 80),
        ];
        row.forEach((val, i) => {
          doc.text(val, x, doc.y, { width: colWidths[i], continued: i < row.length - 1 });
          x += colWidths[i];
        });
        doc.fillColor('black').moveDown(0.2);
      }

      if (validation.issues.length > 500) {
        doc.moveDown(0.5).fontSize(9).fillColor('#666').text(`... and ${validation.issues.length - 500} more issues. Download the Excel report for the full list.`);
      }
    }

    doc.end();
  });
}
