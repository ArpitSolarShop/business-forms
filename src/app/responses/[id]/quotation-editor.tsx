"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  Edit3,
  Check
} from 'lucide-react';

type ProductItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  gstPercent: number;
  baseRate: number;
  qty: number;
  isQuoteOnRequest: boolean;
};

type Props = {
  responseId: string;
  rfqNumber: string;
  status: string;
  createdAt: string;
  orgName: string;
  respondent: string;
  formTitle: string;
  customAnswers: { label: string; value: string }[];
  initialItems: ProductItem[];
  onMarkQuoted: () => Promise<void>;
  onMarkApproved: () => Promise<void>;
};

export function QuotationEditor({
  responseId,
  rfqNumber,
  status: initialStatus,
  createdAt,
  orgName,
  respondent,
  formTitle,
  customAnswers,
  initialItems,
  onMarkQuoted,
  onMarkApproved
}: Props) {
  // Store custom rates in local state for live real-time recalculation
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialItems.forEach(item => {
      // If baseRate > 1, use it. Otherwise, default to 0 (to be quoted)
      map[item.id] = item.baseRate > 1 ? item.baseRate : 0;
    });
    return map;
  });

  const [status, setStatus] = useState(initialStatus);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRateChange = (productId: string, val: string) => {
    const num = parseFloat(val);
    setRates(prev => ({
      ...prev,
      [productId]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  // Live recalculations
  let subtotal = 0;
  let gst = 0;
  let unquotedCount = 0;

  const calculatedItems = initialItems.map(item => {
    const rate = rates[item.id] !== undefined ? rates[item.id] : (item.baseRate > 1 ? item.baseRate : 0);
    const lineTotal = rate * item.qty;
    const lineGst = lineTotal * (item.gstPercent / 100);

    if (rate > 0) {
      subtotal += lineTotal;
      gst += lineGst;
    } else {
      unquotedCount += 1;
    }

    return {
      ...item,
      currentRate: rate,
      lineTotal,
      lineGst,
      isPendingQuote: rate === 0
    };
  });

  const grandTotal = subtotal + gst;

  const handleStatusQuoted = async () => {
    setActionLoading(true);
    try {
      await onMarkQuoted();
      setStatus('Quoted');
    } catch (e) {
      alert("Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusApproved = async () => {
    setActionLoading(true);
    try {
      await onMarkApproved();
      setStatus('Approved');
    } catch (e) {
      alert("Error updating status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action & Navigation Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="h-9 w-9 rounded-xl border border-slate-200/90 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inquiry</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{rfqNumber}</span>
              <span className="text-slate-300">•</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'New' 
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/80' 
                  : status === 'Quoted' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  status === 'New' ? 'bg-amber-500' : status === 'Quoted' ? 'bg-blue-500' : 'bg-emerald-500'
                }`} />
                {status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Received on {new Date(createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {status === 'New' && (
            <Button 
              onClick={handleStatusQuoted} 
              disabled={actionLoading}
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs text-xs font-semibold h-9"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Mark as Quoted
            </Button>
          )}

          {status === 'Quoted' && (
            <Button 
              onClick={handleStatusApproved} 
              disabled={actionLoading}
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs text-xs font-semibold h-9"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Approve Order
            </Button>
          )}

          <Button 
            onClick={() => window.print()}
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save PDF
          </Button>
        </div>

      </div>

      {/* Official Printable Quotation Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm print:shadow-none print:border-none overflow-hidden">
        
        {/* Letterhead */}
        <div className="p-8 sm:p-10 border-b border-slate-200/80 bg-slate-50/40 print:bg-white print:p-0 print:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {orgName}
                  </h1>
                  <p className="text-xs font-medium text-slate-500">Commercial Solar & Electrical Systems</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>Plot No. 42, Phase II, Industrial Area, Okhla, New Delhi</p>
                <p>GSTIN: 07AAACA1234F1Z8 | Email: sales@arpitsolar.in</p>
              </div>
            </div>

            {/* Quotation Ref Block */}
            <div className="text-left sm:text-right space-y-1 sm:self-start">
              <div className="inline-block px-3 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                Commercial Proforma Quotation
              </div>
              <div className="text-xl font-mono font-black text-slate-900 pt-1">
                {rfqNumber}
              </div>
              <div className="text-xs text-slate-500">
                Date: {new Date(createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs text-slate-400">
                Validity: 30 Days from Issue
              </div>
            </div>

          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-8 print:p-0 print:pt-6">
          
          {/* Customer & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/60 print:bg-transparent rounded-xl p-5 border border-slate-200/80 print:border-slate-200">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Client / Billed To</span>
              <p className="font-bold text-slate-900 text-base">{respondent || 'Direct Commercial Buyer'}</p>
              <p className="text-xs text-slate-500">Source: {formTitle}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment & Supply Terms</span>
              <p className="text-xs font-semibold text-slate-800">100% Advance / Immediate Against Proforma</p>
              <p className="text-xs text-slate-500">Delivery: Ex-Warehouse</p>
            </div>
          </div>

          {/* Customer Custom Specifications */}
          {customAnswers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customAnswers.map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200/80 bg-white">
                    <p className="text-[11px] text-slate-400 font-medium">{ans.label}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{ans.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Items Table with Interactive Rate Inputs */}
          {calculatedItems.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Quotation Line Items & Rate Configuration
                </h3>
                <span className="text-[11px] text-indigo-600 print:hidden font-medium">
                  * You can edit rates below before printing
                </span>
              </div>

              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200/80">
                      <th className="py-3 px-4 font-semibold">Item & SKU Code</th>
                      <th className="py-3 px-4 font-semibold text-center">Qty</th>
                      <th className="py-3 px-4 font-semibold text-right">Unit Rate (₹)</th>
                      <th className="py-3 px-4 font-semibold text-right">GST %</th>
                      <th className="py-3 px-4 font-semibold text-right">Taxable Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {calculatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        
                        {/* Name & SKU */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</div>
                        </td>

                        {/* Qty & Unit */}
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-900 whitespace-nowrap">
                          {item.qty} {item.unit}
                        </td>

                        {/* Interactive Unit Rate Input (Print-friendly) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="print:hidden inline-flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-xs">₹</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={rates[item.id] !== undefined ? (rates[item.id] === 0 ? '' : rates[item.id]) : ''}
                              placeholder="Set rate"
                              onChange={(e) => handleRateChange(item.id, e.target.value)}
                              className={`w-24 h-7 text-right font-bold text-xs rounded border px-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                item.isPendingQuote 
                                  ? 'border-amber-300 bg-amber-50/50 text-amber-900 placeholder:text-amber-400' 
                                  : 'border-slate-200 bg-white text-slate-900'
                              }`}
                            />
                          </div>

                          {/* Print Only Text Display */}
                          <div className="hidden print:block font-medium text-slate-800">
                            {item.currentRate > 0 ? (
                              `₹${item.currentRate.toLocaleString()}`
                            ) : (
                              <span className="italic text-slate-400">Rate on Request</span>
                            )}
                          </div>
                        </td>

                        {/* GST % */}
                        <td className="py-3.5 px-4 text-right text-slate-500">
                          {item.gstPercent}%
                        </td>

                        {/* Taxable Total */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {item.currentRate > 0 ? (
                            `₹${item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          ) : (
                            <span className="text-amber-700 italic font-normal text-[11px]">Quote pending</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No catalog items selected in this submission.
            </div>
          )}

          {/* Financial Summary & Bank Details */}
          {calculatedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
              
              {/* Bank Details for Wire Transfer */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Bank Wire Details</span>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-medium">Account Name:</span> {orgName}</p>
                  <p><span className="font-medium">Bank:</span> HDFC Bank Ltd, Industrial Estate Branch</p>
                  <p><span className="font-medium">Account No:</span> 50200098765432</p>
                  <p><span className="font-medium">IFSC Code:</span> HDFC0001234</p>
                </div>
              </div>

              {/* Subtotals & Grand Total */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Taxable Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span className="font-semibold text-slate-800">
                    ₹{gst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t-2 border-slate-900">
                  <span>Final Quoted Amount:</span>
                  <span className="text-indigo-700">
                    ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {unquotedCount > 0 && (
                  <p className="text-[10px] text-amber-700 text-right">
                    * Note: {unquotedCount} item(s) pending rate entry above.
                  </p>
                )}
                <p className="text-[10px] text-slate-400 text-right">
                  Amounts inclusive of all relevant taxes and surcharges.
                </p>
              </div>

            </div>
          )}

          {/* Signatory Footnote */}
          <div className="pt-10 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p>Generated electronically via BusinessForms B2B Portal.</p>
              <p>This is a computer generated quotation and does not require physical signature.</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-slate-300 w-40 mb-2"></div>
              <p className="font-bold text-slate-700">Authorized Signatory</p>
              <p className="text-[10px]">{orgName}</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
