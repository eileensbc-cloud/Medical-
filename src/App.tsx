import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { UploadSection } from './components/UploadSection';
import { ClaimsTable } from './components/ClaimsTable';
import { ReceiptPreviewModal } from './components/ReceiptPreviewModal';
import { ManualClaimModal } from './components/ManualClaimModal';
import { MedicalClaimRecord } from './types/claim';
import { SAMPLE_RECEIPTS } from './utils/sampleReceipts';

const STORAGE_KEY = 'mediclaim_records_v1';
const CURRENCY_KEY = 'mediclaim_currency_v1';

export default function App() {
  const [records, setRecords] = useState<MedicalClaimRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load records from localStorage', e);
    }

    // Default starter record demonstrating the 6 required extracted fields
    const defaultSample = SAMPLE_RECEIPTS[0];
    return [
      {
        id: 'initial_demo_1',
        employeeName: defaultSample.patient,
        clinicName: defaultSample.clinic,
        subTotal: 85.0,
        gst: 7.65,
        grandTotal: 92.65,
        illnessSummary: defaultSample.diagnosis,
        date: '2026-09-28',
        receiptNumber: 'INV-2026-0842',
        currency: 'SGD',
        lineItems: [
          { description: 'General Practitioner Consultation', amount: 45.0 },
          { description: 'Amoxicillin 500mg (20 caps)', amount: 18.0 },
          { description: 'Paracetamol 500mg & Cough Syrup', amount: 14.0 },
          { description: 'Lozenges & Vit C Supplement', amount: 8.0 },
        ],
        notes: 'Pre-loaded example claim. Upload your own receipts above!',
        receiptImageUrl: defaultSample.generateImage(),
        fileName: 'GP_Clinic_Receipt.jpg',
        uploadedAt: 'Today',
        status: 'extracted',
      },
    ];
  });

  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem(CURRENCY_KEY) || 'SGD';
  });

  const [previewRecord, setPreviewRecord] = useState<MedicalClaimRecord | null>(null);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalClaimRecord | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [records]);

  useEffect(() => {
    localStorage.setItem(CURRENCY_KEY, currency);
  }, [currency]);

  // Handlers
  const handleRecordExtracted = (newRecord: MedicalClaimRecord) => {
    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleSaveRecord = (record: MedicalClaimRecord) => {
    if (editingRecord) {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
      setEditingRecord(null);
    } else {
      setRecords((prev) => [record, ...prev]);
    }
  };

  const handleUpdateRecordInline = (
    id: string,
    updatedFields: Partial<MedicalClaimRecord>
  ) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Are you sure you want to delete this medical claim record?')) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (previewRecord?.id === id) {
        setPreviewRecord(null);
      }
    }
  };

  const handleClearAll = () => {
    if (
      records.length > 0 &&
      window.confirm(
        'Are you sure you want to clear all records from the table? This cannot be undone.'
      )
    ) {
      setRecords([]);
      setPreviewRecord(null);
    }
  };

  const handleOpenEditModal = (record: MedicalClaimRecord) => {
    setEditingRecord(record);
    setManualModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingRecord(null);
    setManualModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation & Action Bar */}
      <Header
        records={records}
        currency={currency}
        onCurrencyChange={setCurrency}
        onClearAll={handleClearAll}
        onOpenManualModal={handleOpenNewModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Intro banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 shadow-sm">
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-300 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-2">
              HR & Employee Medical Expense Portal
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Medical Cost Submission & AI OCR Extraction
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-2xl">
              Drag and drop clinic bills or pharmacy invoices. The multimodal OCR automatically
              extracts the employee name, clinic, sub-total, GST, grand total, and illness summary
              directly into an editable table for Excel (.xlsx) export.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-2 rounded-xl text-center border border-white/10">
              <span className="block text-[11px] text-blue-200">Extracted Fields</span>
              <span className="text-sm font-bold text-white">6 Required Attributes</span>
            </div>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <SummaryCards records={records} currency={currency} />

        {/* Upload & OCR Section */}
        <UploadSection
          onRecordExtracted={handleRecordExtracted}
          onOpenManualModal={handleOpenNewModal}
        />

        {/* Claims Table with Search, Filter & Inline Editing */}
        <ClaimsTable
          records={records}
          currency={currency}
          onEditRecord={handleOpenEditModal}
          onDeleteRecord={handleDeleteRecord}
          onViewReceipt={(rec) => setPreviewRecord(rec)}
          onOpenManualModal={handleOpenNewModal}
          onUpdateRecordInline={handleUpdateRecordInline}
        />
      </main>

      {/* Full Receipt Verification Preview Modal */}
      <ReceiptPreviewModal
        record={previewRecord}
        currency={currency}
        onClose={() => setPreviewRecord(null)}
        onEdit={handleOpenEditModal}
      />

      {/* Manual Add / Edit Modal */}
      <ManualClaimModal
        isOpen={manualModalOpen}
        onClose={() => {
          setManualModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialData={editingRecord}
        currency={currency}
      />

      {/* Simple Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MediClaim OCR • Employee Medical Cost Reimbursement Portal</span>
          <span className="text-slate-400">
            Powered by Gemini 3.8 Flash Multimodal OCR & SheetJS XLSX
          </span>
        </div>
      </footer>
    </div>
  );
}
