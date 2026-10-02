import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Check, Building2, User, Activity } from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';

interface ManualClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: MedicalClaimRecord) => void;
  initialData?: MedicalClaimRecord | null;
  currency: string;
}

const COMMON_DIAGNOSES = [
  'Acute URTI, Cough & Cold',
  'Routine Dental Scaling & Polishing',
  'Gastroenteritis & Food Poisoning',
  'Annual Executive Health Screening',
  'Allergic Rhinitis / Dermatitis',
  'Migraine & Tension Headache',
  'Specialist Outpatient Consultation',
  'Physiotherapy / Muscle Strain',
];

export const ManualClaimModal: React.FC<ManualClaimModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  currency,
}) => {
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [subTotal, setSubTotal] = useState<number | ''>('');
  const [gst, setGst] = useState<number | ''>('');
  const [grandTotal, setGrandTotal] = useState<number | ''>('');
  const [illnessSummary, setIllnessSummary] = useState('');
  const [date, setDate] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [autoCalculate, setAutoCalculate] = useState(true);

  useEffect(() => {
    if (initialData) {
      setEmployeeName(initialData.employeeName || '');
      setClinicName(initialData.clinicName || '');
      setSubTotal(initialData.subTotal);
      setGst(initialData.gst);
      setGrandTotal(initialData.grandTotal);
      setIllnessSummary(initialData.illnessSummary || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setReceiptNumber(initialData.receiptNumber || '');
      setNotes(initialData.notes || '');
      setAutoCalculate(false);
    } else {
      setEmployeeName('');
      setClinicName('');
      setSubTotal('');
      setGst(0);
      setGrandTotal('');
      setIllnessSummary('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptNumber('');
      setNotes('');
      setAutoCalculate(true);
    }
  }, [initialData, isOpen]);

  // Handle auto calculation of Grand Total = SubTotal + GST
  const handleSubTotalChange = (val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    setSubTotal(num);
    if (autoCalculate) {
      const g = typeof gst === 'number' ? gst : 0;
      const s = typeof num === 'number' ? num : 0;
      setGrandTotal(Number((s + g).toFixed(2)));
    }
  };

  const handleGstChange = (val: string) => {
    const num = val === '' ? '' : parseFloat(val);
    setGst(num);
    if (autoCalculate) {
      const g = typeof num === 'number' ? num : 0;
      const s = typeof subTotal === 'number' ? subTotal : 0;
      setGrandTotal(Number((s + g).toFixed(2)));
    }
  };

  const handleCalculateGstFromSubtotal = (pct: number) => {
    if (typeof subTotal === 'number') {
      const computedGst = Number(((subTotal * pct) / 100).toFixed(2));
      setGst(computedGst);
      setGrandTotal(Number((subTotal + computedGst).toFixed(2)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeName.trim()) {
      alert('Please enter Name of Employee.');
      return;
    }
    if (!clinicName.trim()) {
      alert('Please enter Clinic Name.');
      return;
    }

    const finalSub = typeof subTotal === 'number' ? subTotal : 0;
    const finalGst = typeof gst === 'number' ? gst : 0;
    const finalGrand =
      typeof grandTotal === 'number' ? grandTotal : Number((finalSub + finalGst).toFixed(2));

    const record: MedicalClaimRecord = {
      id: initialData ? initialData.id : 'claim_' + Date.now() + '_' + Math.random().toString(36).substring(5),
      employeeName: employeeName.trim(),
      clinicName: clinicName.trim(),
      subTotal: finalSub,
      gst: finalGst,
      grandTotal: finalGrand,
      illnessSummary: illnessSummary.trim() || 'General Medical Consultation',
      date: date || new Date().toISOString().split('T')[0],
      receiptNumber: receiptNumber.trim() || 'N/A',
      currency: currency,
      notes: notes.trim(),
      receiptImageUrl: initialData?.receiptImageUrl,
      fileName: initialData?.fileName || 'Manual Entry',
      uploadedAt: initialData?.uploadedAt || new Date().toLocaleTimeString(),
      status: initialData ? initialData.status : 'manual',
    };

    onSave(record);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {initialData ? 'Edit Medical Claim Record' : 'Add Medical Claim Record'}
              </h3>
              <p className="text-xs text-slate-500">
                Enter details for employee medical reimbursement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 1. Name of Employee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              1. Name of Employee <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Alex Tan Hock Soon"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 2. Clinic Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              2. Clinic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Raffles Medical Clinic / Dr. Lim Practice"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 3, 4, 5 Financial Amounts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* 3. Sub-Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                3. Sub-Total ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={subTotal}
                onChange={(e) => handleSubTotalChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* 4. GST */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  4. GST ({currency})
                </label>
                <button
                  type="button"
                  onClick={() => handleCalculateGstFromSubtotal(9)}
                  className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  9% GST
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={gst}
                onChange={(e) => handleGstChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* 5. Grand Total */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                5. Grand Total ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                value={grandTotal}
                onChange={(e) => {
                  setAutoCalculate(false);
                  setGrandTotal(e.target.value === '' ? '' : parseFloat(e.target.value));
                }}
                className="w-full px-3 py-2 text-sm font-bold rounded-lg border border-blue-400 bg-blue-50/60 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 6. Summary of Illness */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              6. Summary of Illness / Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Acute URTI, Fever & Pharyngitis"
              value={illnessSummary}
              onChange={(e) => setIllnessSummary(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Quick suggestion chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center">Suggestions:</span>
              {COMMON_DIAGNOSES.slice(0, 4).map((diag) => (
                <button
                  type="button"
                  key={diag}
                  onClick={() => setIllnessSummary(diag)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 transition-colors"
                >
                  {diag}
                </button>
              ))}
            </div>
          </div>

          {/* Supplementary Dates & Invoice Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Date of Consultation
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Receipt / Tax Invoice No.
              </label>
              <input
                type="text"
                placeholder="e.g., INV-2026-001"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Internal Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g., Claim under annual flex-benefits allowance"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Update Record' : 'Add to Table'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
