"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Printer, 
  CheckCircle2, 
  Truck,
  ReceiptText
} from 'lucide-react';

type ProductItem = {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  category: string;
  unit: string;
  gstPercent: number;
  baseRate: number;
  qty: number;
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
  onUpdateStatus: (newStatus: string) => Promise<void>;
};

export function QuotationEditor({
  rfqNumber,
  status: initialStatus,
  createdAt,
  orgName,
  respondent,
  formTitle,
  customAnswers,
  initialItems,
  onUpdateStatus
}: Props) {
  // Store custom rates in local state (prepopulated with official catalog rate)
  const [rates, setRates] = useState<Record<string, number>>(() =>
    initialItems.reduce<Record<string, number>>((acc, item) => ({
      ...acc,
      [item.id]: item.baseRate || 0,
    }), {})
  );

  // Store custom GST overrides per item
  const [gstOverrides, setGstOverrides] = useState<Record<string, number>>(() =>
    initialItems.reduce<Record<string, number>>((acc, item) => ({
      ...acc,
      [item.id]: item.gstPercent,
    }), {})
  );

  // Store custom unit overrides per item
  const [unitOverrides, setUnitOverrides] = useState<Record<string, string>>(() =>
    initialItems.reduce<Record<string, string>>((acc, item) => ({
      ...acc,
      [item.id]: item.unit,
    }), {})
  );

  const [status, setStatus] = useState(initialStatus);
  const [actionLoading, setActionLoading] = useState(false);

  const handleRateChange = (productId: string, val: string) => {
    const num = parseFloat(val);
    setRates(prev => ({
      ...prev,
      [productId]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  const handleGstChange = (productId: string, val: string) => {
    const num = parseFloat(val);
    setGstOverrides(prev => ({
      ...prev,
      [productId]: isNaN(num) ? 0 : Math.max(0, num)
    }));
  };

  const handleUnitChange = (productId: string, val: string) => {
    setUnitOverrides(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  // Live recalculations
  const calculatedItems = initialItems.map(item => {
    const rate = rates[item.id] !== undefined ? rates[item.id] : item.baseRate;
    const gst = gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : item.gstPercent;
    const unit = unitOverrides[item.id] !== undefined ? unitOverrides[item.id] : item.unit;
    return {
      ...item,
      currentRate: rate,
      gstPercent: gst,
      unit: unit,
      lineTotal: rate * item.qty
    };
  });

  const subtotal = calculatedItems.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalGst = calculatedItems.reduce((acc, item) => acc + (item.lineTotal * (item.gstPercent / 100)), 0);

  const cgst = totalGst / 2;
  const sgst = totalGst / 2;
  const grandTotal = subtotal + totalGst;

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await onUpdateStatus(newStatus);
      setStatus(newStatus);
    } catch {
      alert("Error updating order status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Action & Navigation Bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Order No.</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{rfqNumber}</span>
              <span className="text-slate-300">•</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                status === 'Order Placed' || status === 'New'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                  : status === 'PI Issued' || status === 'Quoted'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : status === 'Payment Confirmed' || status === 'Approved'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-purple-50 text-purple-700 border border-purple-200'
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
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

        {/* Order Status Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {status !== 'PI Issued' && status !== 'Payment Confirmed' && status !== 'Dispatched' && (
            <Button 
              onClick={() => handleStatusChange('PI Issued')} 
              disabled={actionLoading}
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-9"
            >
              <ReceiptText className="w-3.5 h-3.5 mr-1.5" />
              Mark as PI Issued
            </Button>
          )}

          {status !== 'Payment Confirmed' && status !== 'Dispatched' && (
            <Button 
              onClick={() => handleStatusChange('Payment Confirmed')} 
              disabled={actionLoading}
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-9"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Confirm Payment
            </Button>
          )}

          {status !== 'Dispatched' && (
            <Button 
              onClick={() => handleStatusChange('Dispatched')} 
              disabled={actionLoading}
              variant="outline"
              size="sm" 
              className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl text-xs font-semibold h-9"
            >
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Mark as Dispatched
            </Button>
          )}

          <Button 
            onClick={() => window.print()}
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold h-9"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print / Save PDF
          </Button>
        </div>

      </div>

      {/* Official Proforma Invoice (PI) Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm print:shadow-none print:border-none overflow-hidden">
        
        {/* Letterhead */}
        <div className="p-8 sm:p-10 border-b border-slate-200 bg-slate-50/50 print:bg-white print:p-0 print:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="h-14 w-auto flex-shrink-0">
                  {/* Next.js img element for the new logo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Krishnanuja Renewables Logo" className="h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {orgName}
                  </h1>
                  <p className="text-xs font-medium text-slate-500">Solar EPC Services</p>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-0.5 pt-1">
                <p>Office: Sh16/114-25-K-2, Sharvodayanagar, Kadipur, Shivpur, Varanasi 221003 (UP), India</p>
                <p>Warehouse: SH15/243, Bharlai, Shivpur, Varanasi 221003</p>
                <p>GSTIN: 09AAMCK6259J1ZU | CIN: U35105UP2026PTC244522</p>
                <p>Email: info@krishnanuja.com | Phone: +91 9044555572 (WhatsApp & Call)</p>
                <p>Website: www.krishnanuja.com</p>
              </div>
            </div>

            {/* Proforma Box */}
            <div className="text-left sm:text-right space-y-1 sm:self-start">
              <div className="inline-block px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                Proforma Invoice (PI)
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
                Order Status: <strong className="text-slate-800">{status}</strong>
              </div>
            </div>

          </div>
        </div>

        <div className="p-8 sm:p-10 space-y-8 print:p-0 print:pt-6">
          
          {/* Customer & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 print:bg-transparent rounded-xl p-5 border border-slate-200">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Buyer / Billed To</span>
              <p className="font-bold text-slate-900 text-base">{respondent || 'Direct Commercial Buyer'}</p>
              <p className="text-xs text-slate-500">Order Channel: {formTitle}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment & Terms</span>
              <p className="text-xs font-semibold text-slate-800">100% Advance Against PI Before Dispatch</p>
              <p className="text-xs text-slate-500">Delivery: Ex-Factory Warehouse</p>
            </div>
          </div>

          {/* Delivery & Form Answers */}
          {customAnswers.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order & Site Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customAnswers.map((ans, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white text-xs">
                    <p className="text-[11px] text-slate-400 font-medium">{ans.label}</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{ans.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Line Items Table */}
          {calculatedItems.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ordered Solar Materials
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                      <th className="py-3 px-4 w-12 text-center">S.No.</th>
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
                      <th className="py-3 px-4 text-right">GST %</th>
                      <th className="py-3 px-4 text-right">Taxable Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</div>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-900">
                          {item.qty}
                        </td>

                        {/* Editable Unit */}
                        <td className="py-3 px-4 text-center">
                          <div className="print:hidden">
                            <select
                              value={unitOverrides[item.id] !== undefined ? unitOverrides[item.id] : item.unit}
                              onChange={(e) => handleUnitChange(item.id, e.target.value)}
                              className="h-6 text-xs rounded border border-slate-200 px-1 bg-white text-slate-700 focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="Coil">Coil</option>
                              <option value="per bundle">per bundle</option>
                              <option value="per meter">per meter</option>
                              <option value="per mtr">per mtr</option>
                              <option value="piece">piece</option>
                              <option value="per pair">per pair</option>
                              <option value="per kg">per kg</option>
                            </select>
                          </div>
                          <div className="hidden print:block text-slate-600">
                            {item.unit}
                          </div>
                        </td>

                        {/* Interactive Rate Edit (Print: plain text) */}
                        <td className="py-3 px-4 text-right">
                          <div className="print:hidden inline-flex items-center justify-end gap-1">
                            <span>₹</span>
                            <input 
                              type="number"
                              step="1"
                              value={rates[item.id] !== undefined ? rates[item.id] : item.baseRate}
                              onChange={(e) => handleRateChange(item.id, e.target.value)}
                              className="w-20 h-6 text-right font-bold text-xs rounded border border-slate-200 px-1 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="hidden print:block font-medium">
                            ₹{item.currentRate.toLocaleString()}
                          </div>
                        </td>

                        {/* Editable GST % */}
                        <td className="py-3 px-4 text-right">
                          <div className="print:hidden inline-flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="28"
                              value={gstOverrides[item.id] !== undefined ? gstOverrides[item.id] : item.gstPercent}
                              onChange={(e) => handleGstChange(item.id, e.target.value)}
                              className="w-14 h-6 text-right font-bold text-xs rounded border border-slate-200 px-1 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                          <div className="hidden print:block text-slate-500">
                            {item.gstPercent}%
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
              No items in this order.
            </div>
          )}

          {/* Financial Calculation & Bank Details */}
          {calculatedItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
              
              {/* Bank Wire Details for Payment */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Payment Wire Details (RTGS / NEFT)</span>
                <div className="space-y-1 text-slate-600">
                  <p><span className="font-medium">Beneficiary Name:</span> Krishnanuja Renewables Private Limited</p>
                  <p><span className="font-medium">Bank:</span> State Bank of India</p>
                  <p><span className="font-medium">Account No:</span> 45174224440</p>
                  <p><span className="font-medium">IFSC Code:</span> SBIN0064799</p>
                  <p><span className="font-medium">Branch:</span> Phulwariya, Varanasi</p>
                </div>
              </div>

              {/* Subtotal, CGST, SGST, Total */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Taxable Base Subtotal:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>CGST:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>SGST:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t-2 border-slate-900">
                  <span>Total Amount Payable:</span>
                  <span className="text-blue-700">
                    ₹{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  All prices are GST-compliant with input tax credit eligibility.
                </p>
              </div>

            </div>
          )}

          {/* Signatory */}
          <div className="pt-10 flex justify-between items-end text-xs text-slate-400">
            <div>
              <p>Generated electronically via BusinessForms B2B Portal.</p>
              <p>This is a computer generated Proforma Invoice.</p>
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
