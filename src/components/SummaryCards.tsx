import React from 'react';
import { DollarSign, Receipt, Percent, FileCheck } from 'lucide-react';
import { MedicalClaimRecord } from '../types/claim';

interface SummaryCardsProps {
  records: MedicalClaimRecord[];
  currency: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ records, currency }) => {
  const totalSub = records.reduce((acc, r) => acc + (Number(r.subTotal) || 0), 0);
  const totalGst = records.reduce((acc, r) => acc + (Number(r.gst) || 0), 0);
  const grandTotal = records.reduce((acc, r) => acc + (Number(r.grandTotal) || 0), 0);

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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Claims Count */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Claims</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {records.length} <span className="text-xs font-normal text-slate-500">records</span>
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {records.length > 0 ? 'Ready for reimbursement' : 'No receipts uploaded yet'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <FileCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Sub-Total */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sub-Total</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatMoney(totalSub)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Before taxes / GST</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Receipt className="w-5 h-5" />
        </div>
      </div>

      {/* GST Amount */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total GST / Tax</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {formatMoney(totalGst)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {grandTotal > 0 ? `${((totalGst / grandTotal) * 100).toFixed(1)}% of total` : '0%'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <Percent className="w-5 h-5" />
        </div>
      </div>

      {/* Grand Total */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl text-white shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">Grand Total Claimable</p>
          <p className="text-2xl font-extrabold tracking-tight mt-1">
            {formatMoney(grandTotal)}
          </p>
          <p className="text-xs text-blue-200 mt-0.5">
            {records.length > 0 ? `Avg ${formatMoney(grandTotal / records.length)} / claim` : 'Ready to export'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-white/10 text-white flex items-center justify-center backdrop-blur-xs">
          <DollarSign className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
