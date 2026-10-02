import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileImage,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Play,
} from 'lucide-react';
import { SAMPLE_RECEIPTS, SampleReceipt } from '../utils/sampleReceipts';
import { MedicalClaimRecord } from '../types/claim';

interface UploadSectionProps {
  onRecordExtracted: (record: MedicalClaimRecord) => void;
  onOpenManualModal: () => void;
}

interface ProcessingItem {
  id: string;
  name: string;
  progress: string;
  status: 'uploading' | 'analyzing' | 'done' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onRecordExtracted,
  onOpenManualModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<ProcessingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener to support Cmd+V / Ctrl+V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleFiles = (files: File[]) => {
    const validImages = files.filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.name.endsWith('.jpg') ||
        f.name.endsWith('.jpeg') ||
        f.name.endsWith('.png') ||
        f.name.endsWith('.webp')
    );

    if (validImages.length === 0) {
      alert('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    validImages.forEach((file) => {
      processFile(file);
    });
  };

  const processFile = async (file: File) => {
    const itemId = Math.random().toString(36).substring(7);
    const previewUrl = URL.createObjectURL(file);

    setProcessingQueue((prev) => [
      {
        id: itemId,
        name: file.name,
        progress: 'Reading image file...',
        status: 'uploading',
        previewUrl,
      },
      ...prev,
    ]);

    try {
      // Read file as base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                progress: 'Extracting details with Gemini OCR...',
                status: 'analyzing',
              }
            : item
        )
      );

      // Call API
      const response = await fetch('/api/extract-medical-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to extract medical bill data');
      }

      const extracted = resData.data;

      const newRecord: MedicalClaimRecord = {
        id: 'claim_' + Date.now() + '_' + Math.random().toString(36).substring(5),
        employeeName: extracted.employeeName || 'Not Stated',
        clinicName: extracted.clinicName || 'Unknown Clinic',
        subTotal: Number(extracted.subTotal) || 0,
        gst: Number(extracted.gst) || 0,
        grandTotal: Number(extracted.grandTotal) || (Number(extracted.subTotal) + Number(extracted.gst)),
        illnessSummary: extracted.illnessSummary || 'Consultation & Treatment',
        date: extracted.date || new Date().toISOString().split('T')[0],
        receiptNumber: extracted.receiptNumber || 'N/A',
        currency: extracted.currency || 'SGD',
        lineItems: extracted.lineItems || [],
        notes: extracted.notes || '',
        receiptImageUrl: base64Data,
        fileName: file.name,
        uploadedAt: new Date().toLocaleTimeString(),
        status: 'extracted',
      };

      onRecordExtracted(newRecord);

      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                progress: 'Successfully extracted & added to table!',
                status: 'done',
              }
            : item
        )
      );

      // Remove completed item from queue after 3.5s
      setTimeout(() => {
        setProcessingQueue((prev) => prev.filter((item) => item.id !== itemId));
      }, 3500);
    } catch (err: any) {
      console.error('Error during OCR processing:', err);
      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                progress: 'Extraction failed',
                status: 'error',
                errorMessage: err.message || 'Error communicating with OCR server',
              }
            : item
        )
      );
    }
  };

  const handleTestSample = async (sample: SampleReceipt) => {
    const itemId = Math.random().toString(36).substring(7);
    const base64Data = sample.generateImage();

    setProcessingQueue((prev) => [
      {
        id: itemId,
        name: `${sample.clinic} Receipt`,
        progress: 'Sending sample receipt to Gemini OCR...',
        status: 'analyzing',
        previewUrl: base64Data,
      },
      ...prev,
    ]);

    try {
      const response = await fetch('/api/extract-medical-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          mimeType: 'image/jpeg',
          fileName: `${sample.clinic}.jpg`,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Sample extraction failed');
      }

      const extracted = resData.data;

      const newRecord: MedicalClaimRecord = {
        id: 'claim_' + Date.now() + '_' + Math.random().toString(36).substring(5),
        employeeName: extracted.employeeName || sample.patient,
        clinicName: extracted.clinicName || sample.clinic,
        subTotal: Number(extracted.subTotal) || 0,
        gst: Number(extracted.gst) || 0,
        grandTotal: Number(extracted.grandTotal) || sample.total,
        illnessSummary: extracted.illnessSummary || sample.diagnosis,
        date: extracted.date || '2026-09-28',
        receiptNumber: extracted.receiptNumber || 'INV-2026-SAMPLE',
        currency: 'SGD',
        lineItems: extracted.lineItems || [],
        notes: extracted.notes || 'Extracted from sample invoice',
        receiptImageUrl: base64Data,
        fileName: `${sample.name}.jpg`,
        uploadedAt: new Date().toLocaleTimeString(),
        status: 'extracted',
      };

      onRecordExtracted(newRecord);

      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                progress: `Extracted: ${newRecord.employeeName} - ${newRecord.clinicName}`,
                status: 'done',
              }
            : item
        )
      );

      setTimeout(() => {
        setProcessingQueue((prev) => prev.filter((item) => item.id !== itemId));
      }, 3500);
    } catch (err: any) {
      console.error('Error with sample receipt OCR:', err);
      setProcessingQueue((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                progress: 'OCR failed',
                status: 'error',
                errorMessage: err.message,
              }
            : item
        )
      );
    }
  };

  const isAnyProcessing = processingQueue.some(
    (item) => item.status === 'uploading' || item.status === 'analyzing'
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 mb-6">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[0.995]'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
            {isAnyProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-7 h-7 text-blue-600" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-800">
            Upload or Drag & Drop Medical Receipts
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports clinic invoices, doctor bills, and pharmacy slips (PNG, JPG, WebP)
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600">
              Multiple files supported
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-600">
              Ctrl+V to Paste image
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors">
              <FileImage className="w-3.5 h-3.5" />
              Choose Receipt Image
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenManualModal();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Manually
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Processing Queue */}
      {processingQueue.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            OCR Processing Queue
          </p>
          {processingQueue.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-all ${
                item.status === 'done'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  : item.status === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50/50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-9 h-9 object-cover rounded border border-slate-200 bg-white"
                  />
                ) : (
                  <FileText className="w-6 h-6 text-slate-400" />
                )}
                <div>
                  <div className="font-semibold line-clamp-1">{item.name}</div>
                  <div className="text-[11px] opacity-80 flex items-center gap-1.5 mt-0.5">
                    {item.status === 'analyzing' || item.status === 'uploading' ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                        <span>{item.progress}</span>
                      </>
                    ) : item.status === 'done' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{item.progress}</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        <span>{item.errorMessage || item.progress}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {item.status === 'analyzing' && (
                <span className="text-[11px] font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
                  Gemini OCR
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Sample Receipts Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-medium text-slate-700">Don't have a receipt file ready?</span>
            <span className="text-slate-500 hidden md:inline">Test instant OCR extraction with sample clinic bills:</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-2.5">
          {SAMPLE_RECEIPTS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleTestSample(sample)}
              disabled={isAnyProcessing}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-300 text-left transition-all text-xs group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                  {sample.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {sample.patient} • ${sample.total.toFixed(2)}
                </p>
              </div>
              <span className="shrink-0 p-1.5 rounded-md bg-white border border-slate-200 group-hover:border-blue-400 group-hover:text-blue-600 text-slate-400">
                <Play className="w-3 h-3 fill-current" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
