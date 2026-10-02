import React from 'react';
import { FileSpreadsheet, PlusCircle, Trash2, Sparkles, ReceiptText } from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';
import { exportClaimsToExcel } from '../utils/excelExport';

interface HeaderProps {
  records: MedicalClaimRecord[];
  currency: string;
  onCurrencyChange: (curr: string) => void;
  onClearAll: () => void;
  onOpenManualModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  records,
  currency,
  onCurrencyChange,
  onClearAll,
  onOpenManualModal,
}) => {
  const handleExport = () => {
    exportClaimsToExcel(records, currency);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  MediClaim <span className="text-blue-600">OCR</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3 text-blue-500" /> AI-Powered
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Medical Cost Submission & Reimbursement Spreadsheet Generator
              </p>
            </div>
          </div>

          {/* Controls & Export Action */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Currency selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-medium text-slate-700 border border-slate-200">
              <span className="px-2 text-slate-500">Currency:</span>
              {(['SGD', 'USD', 'MYR', 'EUR', 'GBP'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => onCurrencyChange(curr)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    currency === curr
                      ? 'bg-white text-blue-600 shadow-xs font-semibold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>

            {/* Add Manual Record */}
            <button
              onClick={onOpenManualModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              title="Add record manually without receipt image"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Manual Entry</span>
            </button>

            {/* Clear All */}
            {records.length > 0 && (
              <button
                onClick={onClearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 transition-colors"
                title="Clear all records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}

            {/* Export to Excel XLSX button */}
            <button
              onClick={handleExport}
              disabled={records.length === 0}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition-all ${
                records.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-md cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel (.xlsx)</span>
              {records.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-700/60 rounded text-xs">
                  {records.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
