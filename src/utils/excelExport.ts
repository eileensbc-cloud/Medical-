import * as XLSX from 'xlsx';
import { MedicalClaimRecord } from '../types/claim';

export function exportClaimsToExcel(
  records: MedicalClaimRecord[],
  currencyCode = 'SGD',
  filenamePrefix = 'Medical_Claims_Submission'
) {
  if (records.length === 0) {
    alert('No medical claim records available to export.');
    return;
  }

  // Build rows for worksheet
  const rows: any[] = [];

  // Header Title
  rows.push(['MEDICAL COST REIMBURSEMENT SUBMISSION']);
  rows.push([`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`]);
  rows.push([`Total Records: ${records.length}`, `Default Currency: ${currencyCode}`]);
  rows.push([]); // blank line

  // Column Headers
  const headers = [
    'No.',
    'Name of Employee',
    'Clinic Name',
    'Date of Visit',
    'Receipt / Bill No.',
    `Sub-Total (${currencyCode})`,
    `GST (${currencyCode})`,
    `Grand Total (${currencyCode})`,
    'Summary of Illness / Diagnosis',
    'Notes / Remarks',
  ];
  rows.push(headers);

  let totalSub = 0;
  let totalGst = 0;
  let totalGrand = 0;

  records.forEach((rec, idx) => {
    const sub = Number(rec.subTotal) || 0;
    const gst = Number(rec.gst) || 0;
    const grand = Number(rec.grandTotal) || (sub + gst);

    totalSub += sub;
    totalGst += gst;
    totalGrand += grand;

    rows.push([
      idx + 1,
      rec.employeeName || 'N/A',
      rec.clinicName || 'N/A',
      rec.date || '-',
      rec.receiptNumber || '-',
      Number(sub.toFixed(2)),
      Number(gst.toFixed(2)),
      Number(grand.toFixed(2)),
      rec.illnessSummary || 'General Consultation',
      rec.notes || '',
    ]);
  });

  // Summary Row
  rows.push([]);
  rows.push([
    'TOTAL',
    '',
    '',
    '',
    '',
    Number(totalSub.toFixed(2)),
    Number(totalGst.toFixed(2)),
    Number(totalGrand.toFixed(2)),
    `Total Claims: ${records.length}`,
    '',
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths auto-adjustment
  ws['!cols'] = [
    { wch: 6 },  // No.
    { wch: 24 }, // Name of Employee
    { wch: 30 }, // Clinic Name
    { wch: 14 }, // Date of Visit
    { wch: 18 }, // Receipt No.
    { wch: 16 }, // Sub-Total
    { wch: 14 }, // GST
    { wch: 18 }, // Grand Total
    { wch: 38 }, // Summary of Illness
    { wch: 25 }, // Notes
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Medical Claims');

  // Format filename with current date
  const dateStr = new Date().toISOString().split('T')[0];
  const fullFileName = `${filenamePrefix}_${dateStr}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, fullFileName);
}
