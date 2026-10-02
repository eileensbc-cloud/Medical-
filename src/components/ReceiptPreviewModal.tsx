import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Building2,
  User,
  DollarSign,
  Activity,
  Calendar,
  FileCheck,
  Edit3,
} from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';

interface ReceiptPreviewModalProps {
  record: MedicalClaimRecord | null;
  currency: string;
  onClose: () => void;
  onEdit: (record: MedicalClaimRecord) => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  record,
  currency,
  onClose,
  onEdit,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!record) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'SGD' || currency === 'USD' ? 'USD' : currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
    })
      .format(val)
      .replace('USD', '$');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Medical Claim & Receipt Verification
              </h3>
              <p className="text-xs text-slate-500">
                Cross-reference OCR extracted values with the original medical invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Details
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          {/* Left: Receipt Image Viewer with Zoom Controls */}
          <div className="lg:col-span-7 bg-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[320px] lg:min-h-[500px]">
            {/* Zoom toolbar */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-white">
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                title="Reset View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <span className="text-[11px] px-2 text-slate-400 font-mono">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Image viewer */}
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4 max-h-[550px]">
              {record.receiptImageUrl ? (
                <img
                  src={record.receiptImageUrl}
                  alt="Receipt Scan"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-h-[480px] max-w-full object-contain rounded shadow-lg select-none"
                />
              ) : (
                <div className="text-center text-slate-400 p-8">
                  <p className="text-sm">No original receipt image attached (Manual Record)</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Extracted OCR Details */}
          <div className="lg:col-span-5 p-5 sm:p-6 overflow-y-auto max-h-[550px] space-y-4 bg-white">
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                OCR Extracted Attributes
              </span>
              <h4 className="text-base font-bold text-slate-900 mt-2">
                Field Breakdown & Audit
              </h4>
            </div>

            {/* 1. Name of Employee */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  1. Name of Employee
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {record.employeeName || 'Not Stated'}
              </p>
            </div>

            {/* 2. Clinic Name */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  2. Clinic Name
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                {record.clinicName}
              </p>
            </div>

            {/* 3, 4, 5. Sub-Total, GST, Grand Total */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">3. Sub-Total:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatMoney(record.subTotal)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">4. GST / Tax:</span>
                <span className="font-mono font-semibold text-amber-700">
                  {formatMoney(record.gst)}
                </span>
              </div>

              <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">5. Grand Total:</span>
                <span className="text-base font-extrabold font-mono text-blue-700">
                  {formatMoney(record.grandTotal)}
                </span>
              </div>
            </div>

            {/* 6. Summary of Illness */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  6. Summary of Illness / Diagnosis
                </span>
              </div>
              <p className="text-xs font-medium text-slate-800 leading-relaxed">
                {record.illnessSummary || 'Consultation & Medication'}
              </p>
            </div>

            {/* Supplementary Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Date of Visit
                </span>
                <span className="font-medium text-slate-800">{record.date || '-'}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Invoice / Bill No.
                </span>
                <span className="font-mono font-medium text-slate-800">
                  {record.receiptNumber || '-'}
                </span>
              </div>
            </div>

            {/* Line items breakdown if available */}
            {record.lineItems && record.lineItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-slate-600 block mb-2">
                  Itemized Charges Breakdown:
                </span>
                <div className="space-y-1 text-xs">
                  {record.lineItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span className="truncate pr-2">{item.description}</span>
                      <span className="font-mono shrink-0">${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Uploaded: {record.uploadedAt}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
