export interface SampleReceipt {
  id: string;
  name: string;
  clinic: string;
  patient: string;
  diagnosis: string;
  total: number;
  generateImage: () => string; // returns base64 data url
}

// Generate realistic crisp thermal / clinic receipts using HTML5 canvas
export function createReceiptCanvas(data: {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  taxReg: string;
  receiptNo: string;
  date: string;
  patientName: string;
  doctorName: string;
  items: Array<{ desc: string; price: number }>;
  subTotal: number;
  gst: number;
  grandTotal: number;
  diagnosis: string;
  paymentMethod: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 880;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - realistic slight cream paper texture
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle border / receipt outline shadow
  ctx.strokeStyle = '#e2ded5';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Header band
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(data.clinicName.toUpperCase(), canvas.width / 2, 60);

  ctx.fillStyle = '#475569';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText(data.clinicAddress, canvas.width / 2, 85);
  ctx.fillText(`Tel: ${data.clinicPhone} | Reg/GST No: ${data.taxReg}`, canvas.width / 2, 105);

  // Clinic divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(35, 125);
  ctx.lineTo(canvas.width - 35, 125);
  ctx.stroke();

  // Receipt meta
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('OFFICIAL MEDICAL TAX INVOICE / RECEIPT', canvas.width / 2, 155);

  ctx.textAlign = 'left';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#334155';
  ctx.fillText(`Tax Invoice No: ${data.receiptNo}`, 45, 190);
  ctx.fillText(`Date of Visit: ${data.date}`, 45, 212);
  ctx.fillText(`Attending Doctor: ${data.doctorName}`, 45, 234);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(`PATIENT / EMPLOYEE NAME: ${data.patientName}`, 45, 265);

  ctx.fillStyle = '#2563eb';
  ctx.font = 'italic 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Diagnosis / Reason for Visit: ${data.diagnosis}`, 45, 290);

  // Table header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, 310, canvas.width - 80, 30);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(40, 310, canvas.width - 80, 30);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText('DESCRIPTION / SERVICE', 55, 330);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT ($)', canvas.width - 55, 330);

  // Items
  let y = 370;
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1e293b';

  data.items.forEach((item) => {
    ctx.textAlign = 'left';
    ctx.fillText(item.desc, 55, y);
    ctx.textAlign = 'right';
    ctx.fillText(item.price.toFixed(2), canvas.width - 55, y);
    y += 32;
  });

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(40, y + 10);
  ctx.lineTo(canvas.width - 40, y + 10);
  ctx.stroke();
  ctx.setLineDash([]);

  // Totals section
  y += 45;
  ctx.textAlign = 'right';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#475569';

  ctx.fillText('SUB-TOTAL:', canvas.width - 150, y);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`$${data.subTotal.toFixed(2)}`, canvas.width - 55, y);

  y += 28;
  ctx.fillStyle = '#475569';
  ctx.fillText('GST (9%):', canvas.width - 150, y);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`$${data.gst.toFixed(2)}`, canvas.width - 55, y);

  y += 35;
  // Grand total highlight box
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(canvas.width - 290, y - 24, 250, 40);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(canvas.width - 290, y - 24, 250, 40);

  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1d4ed8';
  ctx.fillText('GRAND TOTAL:', canvas.width - 150, y + 2);
  ctx.fillText(`$${data.grandTotal.toFixed(2)}`, canvas.width - 55, y + 2);

  // Footer notes
  y += 80;
  ctx.textAlign = 'center';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Payment Mode: ${data.paymentMethod} (PAID IN FULL)`, canvas.width / 2, y);
  ctx.fillText('Thank you for choosing our clinic. Get well soon!', canvas.width / 2, y + 22);

  // Barcode representation
  y += 50;
  ctx.fillStyle = '#1e293b';
  for (let i = 0; i < 60; i++) {
    const barWidth = (i % 3 === 0 ? 3 : (i % 2 === 0 ? 2 : 1));
    const bx = 180 + i * 5;
    ctx.fillRect(bx, y, barWidth, 35);
  }
  ctx.font = '11px monospace';
  ctx.fillText(`*${data.receiptNo}*`, canvas.width / 2, y + 50);

  return canvas.toDataURL('image/jpeg', 0.95);
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'sample-1',
    name: 'GP Clinic - URTI & Fever',
    clinic: 'Dr. Rachel Lim Family Practice & Surgery',
    patient: 'Alex Tan Hock Soon',
    diagnosis: 'Acute URTI, Pharyngitis & Mild Fever',
    total: 92.65,
    generateImage: () =>
      createReceiptCanvas({
        clinicName: 'Dr. Rachel Lim Family Practice & Surgery',
        clinicAddress: '123 Tanjong Pagar Road #02-05, Singapore 088539',
        clinicPhone: '+65 6223 8819',
        taxReg: '201918274G',
        receiptNo: 'INV-2026-0842',
        date: '2026-09-28',
        patientName: 'Alex Tan Hock Soon',
        doctorName: 'Dr. Rachel Lim (MBBS, MMed)',
        items: [
          { desc: 'General Practitioner Consultation', price: 45.0 },
          { desc: 'Amoxicillin 500mg (20 capsules)', price: 18.0 },
          { desc: 'Paracetamol 500mg & Cough Syrup', price: 14.0 },
          { desc: 'Lozenges & Vit C Supplement', price: 8.0 },
        ],
        subTotal: 85.0,
        gst: 7.65,
        grandTotal: 92.65,
        diagnosis: 'Acute Upper Respiratory Tract Infection (URTI) with Fever',
        paymentMethod: 'Corporate Insurance / NETS',
      }),
  },
  {
    id: 'sample-2',
    name: 'Dental Care - Scaling & Fluoride',
    clinic: 'SmileCraft Dental Specialist Centre',
    patient: 'Jessica Wong Hui Min',
    diagnosis: 'Routine Dental Scaling, Polishing & Fluoride Treatment',
    total: 174.4,
    generateImage: () =>
      createReceiptCanvas({
        clinicName: 'SmileCraft Dental Specialist Centre',
        clinicAddress: '88 Orchard Road #06-12, Paragon Medical, Singapore 238839',
        clinicPhone: '+65 6734 5590',
        taxReg: '201809112M',
        receiptNo: 'DEN-2026-4410',
        date: '2026-09-24',
        patientName: 'Jessica Wong Hui Min',
        doctorName: 'Dr. Jonathan Chan (BDS)',
        items: [
          { desc: 'Dental Examination & Oral Health Assessment', price: 40.0 },
          { desc: 'Ultrasonic Scaling & Stain Removal', price: 80.0 },
          { desc: 'Airflow Polishing & Prophylaxis', price: 25.0 },
          { desc: 'Topical Fluoride Treatment', price: 15.0 },
        ],
        subTotal: 160.0,
        gst: 14.4,
        grandTotal: 174.4,
        diagnosis: 'Preventive Dental Care & Oral Hygiene',
        paymentMethod: 'Credit Card (Visa)',
      }),
  },
  {
    id: 'sample-3',
    name: 'Specialist Clinic - Gastroenteritis',
    clinic: 'Novena Specialist Physicians Pte Ltd',
    patient: 'Ahmad Bin Ibrahim',
    diagnosis: 'Acute Gastroenteritis & Gastric Reflux',
    total: 239.8,
    generateImage: () =>
      createReceiptCanvas({
        clinicName: 'Novena Specialist Physicians Pte Ltd',
        clinicAddress: '10 Sinaran Drive #11-04, Novena Medical Center, Singapore 307506',
        clinicPhone: '+65 6397 2200',
        taxReg: '201622340K',
        receiptNo: 'SPEC-2026-1193',
        date: '2026-09-18',
        patientName: 'Ahmad Bin Ibrahim',
        doctorName: 'Dr. Michael Soh (FRCP, FAMS)',
        items: [
          { desc: 'Specialist Medical Consultation (First Visit)', price: 140.0 },
          { desc: 'Omeprazole 20mg & Domperidone 10mg', price: 38.0 },
          { desc: 'Electrolyte Rehydration Salts (10 pkts)', price: 18.0 },
          { desc: 'Abdominal Point-of-Care Ultrasound', price: 24.0 },
        ],
        subTotal: 220.0,
        gst: 19.8,
        grandTotal: 239.8,
        diagnosis: 'Acute Gastroenteritis & Abdominal Cramps',
        paymentMethod: 'Corporate Direct Billing',
      }),
  },
  {
    id: 'sample-4',
    name: '24hr Urgent Care - Dermatitis',
    clinic: 'CarePlus 24hr Clinic & Medical Center',
    patient: 'Emily Watson',
    diagnosis: 'Contact Allergic Dermatitis & Skin Rash',
    total: 76.3,
    generateImage: () =>
      createReceiptCanvas({
        clinicName: 'CarePlus 24hr Clinic & Medical Center',
        clinicAddress: '450 Jurong East St 21 #01-118, Singapore 600450',
        clinicPhone: '+65 6560 9922',
        taxReg: '202033481D',
        receiptNo: 'CP-2026-9051',
        date: '2026-09-15',
        patientName: 'Emily Watson',
        doctorName: 'Dr. Kevin Nair (MBBS)',
        items: [
          { desc: 'Extended Hours Outpatient Consultation', price: 42.0 },
          { desc: 'Hydrocortisone 1% Topical Cream 15g', price: 16.0 },
          { desc: 'Cetirizine 10mg Anti-histamine (14 tabs)', price: 12.0 },
        ],
        subTotal: 70.0,
        gst: 6.3,
        grandTotal: 76.3,
        diagnosis: 'Allergic Contact Dermatitis & Pruritus',
        paymentMethod: 'PayNow / GrabPay',
      }),
  },
];
