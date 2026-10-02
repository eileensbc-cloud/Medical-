import React, { useState } from 'react';
import {
  FileText,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  ArrowUpDown,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';
import { exportClaimsToExcel } from '../utils/excelExport';

interface ClaimsTableProps {
  records: MedicalClaimRecord[];
  currency: string;
  onEditRecord: (record: MedicalClaimRecord) => void;
  onDeleteRecord: (id: string) => void;
  onViewReceipt: (record: MedicalClaimRecord) => void;
  onOpenManualModal: () => void;
  onUpdateRecordInline: (id: string, updatedFields: Partial<MedicalClaimRecord>) => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({
  records,
  currency,
  onEditRecord,
  onDeleteRecord,
  onViewReceipt,
  onOpenManualModal,
  onUpdateRecordInline,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'grandTotal' | 'employeeName' | 'clinicName'>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineForm, setInlineForm] = useState<Partial<MedicalClaimRecord>>({});

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

  // Filter records
  const filteredRecords = records.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.employeeName.toLowerCase().includes(term) ||
      r.clinicName.toLowerCase().includes(term) ||
      r.illnessSummary.toLowerCase().includes(term) ||
      (r.receiptNumber && r.receiptNumber.toLowerCase().includes(term)) ||
      (r.date && r.date.toLowerCase().includes(term))
    );
  });

  // Sort records
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'grandTotal') {
      comparison = (a.grandTotal || 0) - (b.grandTotal || 0);
    } else if (sortField === 'employeeName') {
      comparison = a.employeeName.localeCompare(b.employeeName);
    } else if (sortField === 'clinicName') {
      comparison = a.clinicName.localeCompare(b.clinicName);
    } else if (sortField === 'date') {
      comparison = (a.date || '').localeCompare(b.date || '');
    }
    return sortAsc ? comparison : -comparison;
  });

  // Calculate totals
  const totalSub = records.reduce((acc, r) => acc + (Number(r.subTotal) || 0), 0);
  const totalGst = records.reduce((acc, r) => acc + (Number(r.gst) || 0), 0);
  const totalGrand = records.reduce((acc, r) => acc + (Number(r.grandTotal) || 0), 0);

  const startInlineEdit = (record: MedicalClaimRecord) => {
    setEditingId(record.id);
    setInlineForm({
      employeeName: record.employeeName,
      clinicName: record.clinicName,
      subTotal: record.subTotal,
      gst: record.gst,
      grandTotal: record.grandTotal,
      illnessSummary: record.illnessSummary,
      date: record.date,
    });
  };

  const saveInlineEdit = (id: string) => {
    const sub = Number(inlineForm.subTotal) || 0;
    const gst = Number(inlineForm.gst) || 0;
    const grand = Number(inlineForm.grandTotal) || (sub + gst);

    onUpdateRecordInline(id, {
      ...inlineForm,
      subTotal: sub,
      gst: gst,
      grandTotal: grand,
    });
    setEditingId(null);
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setInlineForm({});
  };

  const handleSort = (field: 'date' | 'grandTotal' | 'employeeName' | 'clinicName') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Extracted Medical Claims</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {records.length} records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and adjust extracted data. You can keep adding records anytime.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, clinic, illness..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8.5 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56 sm:w-64"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Export Button */}
          {records.length > 0 && (
            <button
              onClick={() => exportClaimsToExcel(records, currency)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              title="Download Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Component */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-12 text-center">#</th>
              <th className="py-3 px-3 w-14 text-center">Receipt</th>
              <th
                onClick={() => handleSort('employeeName')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>1. Name of Employee</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('clinicName')}
                className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>2. Clinic Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">3. Sub-Total</th>
              <th className="py-3 px-3 text-right">4. GST</th>
              <th
                onClick={() => handleSort('grandTotal')}
                className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>5. Grand Total</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4">6. Summary of Illness</th>
              <th
                onClick={() => handleSort('date')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Date / Ref</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No medical records in table</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm
                        ? 'No records match your search filter.'
                        : 'Upload or drop a receipt above, or try one of the sample receipts to see OCR in action.'}
                    </p>
                    <button
                      onClick={onOpenManualModal}
                      className="mt-4 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      + Add Record Manually
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRecords.map((record, index) => {
                const isEditing = editingId === record.id;

                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isEditing ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    {/* Receipt Thumbnail */}
                    <td className="py-3 px-3 text-center">
                      {record.receiptImageUrl ? (
                        <button
                          onClick={() => onViewReceipt(record)}
                          className="relative group block mx-auto cursor-pointer"
                          title="Click to view full receipt"
                        >
                          <img
                            src={record.receiptImageUrl}
                            alt="Receipt"
                            className="w-8 h-10 object-cover rounded border border-slate-200 group-hover:border-blue-500 shadow-2xs transition-all"
                          />
                          <span className="absolute inset-0 bg-blue-600/20 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center text-blue-800 transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white drop-shadow" />
                          </span>
                        </button>
                      ) : (
                        <span className="inline-block w-8 h-8 rounded bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-[10px]">
                          Manual
                        </span>
                      )}
                    </td>

                    {/* 1. Name of Employee */}
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={inlineForm.employeeName || ''}
                          onChange={(e) =>
                            setInlineForm({ ...inlineForm, employeeName: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs border border-blue-400 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{record.employeeName}</span>
                          {record.status === 'extracted' && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                              title="Extracted via OCR"
                            />
                          )}
                        </div>
                      )}
                    </td>

                    {/* 2. Clinic Name */}
                    <td className="py-3 px-4 text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={inlineForm.clinicName || ''}
                          onChange={(e) =>
                            setInlineForm({ ...inlineForm, clinicName: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs border border-blue-400 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="max-w-[200px] truncate" title={record.clinicName}>
                          {record.clinicName}
                        </div>
                      )}
                    </td>

                    {/* 3. Sub-Total */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={inlineForm.subTotal ?? 0}
                          onChange={(e) => {
                            const newSub = parseFloat(e.target.value) || 0;
                            const currentGst = inlineForm.gst ?? record.gst;
                            setInlineForm({
                              ...inlineForm,
                              subTotal: newSub,
                              grandTotal: Number((newSub + currentGst).toFixed(2)),
                            });
                          }}
                          className="w-20 px-2 py-1 text-xs text-right border border-blue-400 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        formatMoney(record.subTotal)
                      )}
                    </td>

                    {/* 4. GST */}
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={inlineForm.gst ?? 0}
                          onChange={(e) => {
                            const newGst = parseFloat(e.target.value) || 0;
                            const currentSub = inlineForm.subTotal ?? record.subTotal;
                            setInlineForm({
                              ...inlineForm,
                              gst: newGst,
                              grandTotal: Number((currentSub + newGst).toFixed(2)),
                            });
                          }}
                          className="w-18 px-2 py-1 text-xs text-right border border-blue-400 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        formatMoney(record.gst)
                      )}
                    </td>

                    {/* 5. Grand Total */}
                    <td className="py-3 px-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={inlineForm.grandTotal ?? 0}
                          onChange={(e) =>
                            setInlineForm({
                              ...inlineForm,
                              grandTotal: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-22 px-2 py-1 text-xs text-right font-bold border border-blue-400 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-bold text-slate-900 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-100 font-mono">
                          {formatMoney(record.grandTotal)}
                        </span>
                      )}
                    </td>

                    {/* 6. Summary of Illness */}
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={inlineForm.illnessSummary || ''}
                          onChange={(e) =>
                            setInlineForm({ ...inlineForm, illnessSummary: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs border border-blue-400 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="max-w-[240px]">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200/70 truncate max-w-full">
                            {record.illnessSummary || 'General Medical Consultation'}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Date / Receipt No. */}
                    <td className="py-3 px-3 text-slate-500">
                      {isEditing ? (
                        <input
                          type="date"
                          value={inlineForm.date || ''}
                          onChange={(e) =>
                            setInlineForm({ ...inlineForm, date: e.target.value })
                          }
                          className="w-28 px-1.5 py-1 text-xs border border-blue-400 rounded"
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-slate-700">{record.date || '-'}</div>
                          {record.receiptNumber && record.receiptNumber !== 'N/A' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              #{record.receiptNumber}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => saveInlineEdit(record.id)}
                            className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                            title="Save changes"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewReceipt(record)}
                            className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="View receipt & full details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => startInlineEdit(record)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Quick edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(record.id)}
                            className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete claim record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {records.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                <td colSpan={4} className="py-3 px-4 text-right tracking-wider uppercase text-[11px] text-slate-600">
                  Total (All {records.length} Claims):
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-800">
                  {formatMoney(totalSub)}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-700">
                  {formatMoney(totalGst)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-blue-700 text-sm">
                  {formatMoney(totalGrand)}
                </td>
                <td colSpan={3} className="py-3 px-4 text-slate-500 text-[11px]">
                  All claims ready for submission
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
