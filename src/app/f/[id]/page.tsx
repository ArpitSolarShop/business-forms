"use client";

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  Search, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  ReceiptText,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  gstPercent: number;
  baseRate: number;
};

type FormField = {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
};

type FormInfo = {
  id: string;
  title: string;
  description: string;
  organization: { name: string };
  fields: FormField[];
  products: Product[];
};

export default function FormViewer({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [form, setForm] = useState<FormInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPi, setSubmittedPi] = useState<string>('');
  
  // Buyer form answers
  const [buyerName, setBuyerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Product cart state { [productId]: quantity }
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetch(`/api/forms/${resolvedParams.id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setForm(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resolvedParams.id]);

  const updateCart = (productId: string, qty: number) => {
    const validQty = Math.max(0, isNaN(qty) ? 0 : qty);
    setCart(prev => {
      const newCart = { ...prev };
      if (validQty === 0) delete newCart[productId];
      else newCart[productId] = validQty;
      return newCart;
    });
  };

  // Accurate Rate & GST Calculation
  const getCartTotals = () => {
    if (!form || !form.products) {
      return { subtotal: 0, itemsCount: 0, unitsCount: 0, cgst: 0, sgst: 0, totalGst: 0, grandTotal: 0 };
    }
    
    let subtotal = 0;
    let itemsCount = 0;
    let unitsCount = 0;
    let totalGst = 0;

    Object.entries(cart).forEach(([id, qty]) => {
      if (qty <= 0) return;
      const product = form.products.find(p => p.id === id);
      if (product) {
        itemsCount += 1;
        unitsCount += qty;
        
        const lineBase = product.baseRate * qty;
        subtotal += lineBase;
        
        // Exact GST based on actual configured percentage
        totalGst += lineBase * (product.gstPercent / 100);
      }
    });

    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const grandTotal = subtotal + totalGst;

    return { 
      subtotal, 
      itemsCount, 
      unitsCount, 
      cgst, 
      sgst, 
      totalGst, 
      grandTotal 
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (!buyerName.trim()) {
      alert("Please enter your Name or Firm Name.");
      return;
    }

    if (!contactNumber.trim()) {
      alert("Please enter your Phone or WhatsApp Number.");
      return;
    }

    const totals = getCartTotals();
    if (totals.unitsCount === 0) {
      alert("Please enter the quantity for at least one solar material.");
      return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers: { fieldId: string; value: string }[] = [];

      const gstField = form.fields.find(f => f.type === 'TEXT');
      if (gstField && gstin) {
        formattedAnswers.push({ fieldId: gstField.id, value: gstin });
      }

      const addressField = form.fields.find(f => f.type === 'PARAGRAPH');
      if (addressField) {
        const fullAddress = additionalNotes ? `${deliveryAddress}\nNotes: ${additionalNotes}` : deliveryAddress;
        formattedAnswers.push({ fieldId: addressField.id, value: fullAddress });
      }

      // Attach cart as PRODUCT_TABLE answer
      const productField = form.fields.find(f => f.type === 'PRODUCT_TABLE');
      if (productField) {
        formattedAnswers.push({
          fieldId: productField.id,
          value: JSON.stringify(cart)
        });
      }

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          respondent: `${buyerName} (${contactNumber})`,
          answers: formattedAnswers
        })
      });

      if (res.ok) {
        const result = await res.json();
        setSubmittedPi(result.rfqNumber || 'PI-CONFIRMED');
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Failed to submit order. Please try again.");
      }
    } catch {
      alert("Network error submitting order. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Order Booking Portal...
        </span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-900">Order Form Not Found</h1>
        <p className="text-xs text-slate-500 mt-1">This order form does not exist or has expired.</p>
      </div>
    );
  }

  const totals = getCartTotals();

  // Category counts
  const categoryCounts: Record<string, number> = {};
  (form.products || []).forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  const categories = ['ALL', ...Object.keys(categoryCounts)];

  const filteredProducts = (form.products || []).filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Success Screen
  // ─── PDF Generation ───
  const generateOrderPDF = () => {
    if (!form) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = 14;

    const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // ── Header Band ──
    doc.setFillColor(30, 64, 175); // blue-800
    doc.rect(0, 0, pageW, 46, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(form.organization.name, margin, 14);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('GSTIN: 09AAMCK6259J1ZU | CIN: U35105UP2026PTC244522', margin, 20);
    doc.text('Office: Sh16/114-25-K-2, Sharvodayanagar, Kadipur, Shivpur, Varanasi 221003 (UP), India', margin, 24);
    doc.text('Warehouse: SH15/243, Bharlai, Shivpur, Varanasi 221003', margin, 28);
    doc.text('Phone: +91 9044555572 (WhatsApp & Call) | Email: info@krishnanuja.com | Web: www.krishnanuja.com', margin, 32);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Proforma Invoice / Order Confirmation', margin, 41);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageW - margin, 14, { align: 'right' });
    doc.text(`PI No: ${submittedPi}`, pageW - margin, 21, { align: 'right' });
    y = 54;

    // ── Buyer Info Box ──
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentW, deliveryAddress ? 36 : 26, 2, 2, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO / BUYER DETAILS', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Name / Firm: ${buyerName}`, margin + 4, y + 12);
    doc.text(`Phone: ${contactNumber}`, pageW - margin - 4, y + 12, { align: 'right' });
    if (gstin) {
      doc.text(`GSTIN: ${gstin}`, margin + 4, y + 19);
    }
    if (deliveryAddress) {
      const addrLines = doc.splitTextToSize(`Delivery: ${deliveryAddress}`, contentW - 8);
      doc.text(addrLines, margin + 4, gstin ? y + 26 : y + 19);
    }
    y += (deliveryAddress ? 42 : 32);

    // ── Product Table ──
    // Table header
    const cols = [
      { label: 'S.No', w: 10, align: 'center' as const },
      { label: 'Item Description', w: 52, align: 'left' as const },
      { label: 'Unit', w: 18, align: 'center' as const },
      { label: 'Base Rate', w: 22, align: 'right' as const },
      { label: 'GST %', w: 14, align: 'center' as const },
      { label: 'Qty', w: 12, align: 'center' as const },
      { label: 'Tax Amt', w: 22, align: 'right' as const },
      { label: 'Line Total', w: 24, align: 'right' as const },
    ];
    // Adjust last column to fill remaining width
    const totalColW = cols.reduce((s, c) => s + c.w, 0);
    if (totalColW < contentW) cols[cols.length - 1].w += contentW - totalColW;

    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentW, 8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 8, margin + contentW, y + 8);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    let colX = margin;
    cols.forEach(col => {
      const textX = col.align === 'right' ? colX + col.w - 2 : col.align === 'center' ? colX + col.w / 2 : colX + 2;
      doc.text(col.label, textX, y + 5.5, { align: col.align });
      colX += col.w;
    });
    y += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let rowIndex = 0;
    const orderedProducts = (form.products || []).filter(p => (cart[p.id] || 0) > 0);
    orderedProducts.forEach((product) => {
      const qty = cart[product.id] || 0;
      if (qty <= 0) return;

      const lineBase = product.baseRate * qty;
      const lineTax = lineBase * (product.gstPercent / 100);
      const lineTotal = lineBase + lineTax;
      rowIndex++;

      // Check for page break
      if (y + 8 > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        y = 14;
      }

      // Zebra stripe
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentW, 7, 'F');
      }

      doc.setTextColor(30, 41, 59);
      colX = margin;
      const rowData = [
        { text: String(rowIndex), align: 'center' as const },
        { text: product.name, align: 'left' as const },
        { text: product.unit, align: 'center' as const },
        { text: `Rs.${fmt(product.baseRate)}`, align: 'right' as const },
        { text: `${product.gstPercent}%`, align: 'center' as const },
        { text: String(qty), align: 'center' as const },
        { text: `Rs.${fmt(lineTax)}`, align: 'right' as const },
        { text: `Rs.${fmt(lineTotal)}`, align: 'right' as const },
      ];

      rowData.forEach((cell, i) => {
        const col = cols[i];
        const textX = cell.align === 'right' ? colX + col.w - 2 : cell.align === 'center' ? colX + col.w / 2 : colX + 2;
        // Truncate long text
        let cellText = cell.text;
        if (i === 1 && doc.getTextWidth(cellText) > col.w - 4) {
          while (doc.getTextWidth(cellText + '...') > col.w - 4 && cellText.length > 3) {
            cellText = cellText.slice(0, -1);
          }
          cellText += '...';
        }
        doc.text(cellText, textX, y + 5, { align: cell.align });
        colX += col.w;
      });
      y += 7;
    });

    // Table bottom line
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, margin + contentW, y);
    y += 6;

    // ── Totals Box ──
    const totalsBoxW = 80;
    const totalsX = pageW - margin - totalsBoxW;

    // Check for page break
    if (y + 40 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 14;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(totalsX, y, totalsBoxW, 34, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Taxable Subtotal:', totalsX + 4, y + 7);
    doc.setTextColor(30, 41, 59);
    doc.text(`Rs.${fmt(totals.subtotal)}`, totalsX + totalsBoxW - 4, y + 7, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text(`CGST:`, totalsX + 4, y + 13);
    doc.setTextColor(30, 41, 59);
    doc.text(`Rs.${fmt(totals.cgst)}`, totalsX + totalsBoxW - 4, y + 13, { align: 'right' });

    doc.setTextColor(100, 116, 139);
    doc.text(`SGST:`, totalsX + 4, y + 19);
    doc.setTextColor(30, 41, 59);
    doc.text(`Rs.${fmt(totals.sgst)}`, totalsX + totalsBoxW - 4, y + 19, { align: 'right' });

    // Divider
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(totalsX + 4, y + 23, totalsX + totalsBoxW - 4, y + 23);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Total Payable:', totalsX + 4, y + 30);
    doc.text(`Rs.${fmt(totals.grandTotal)}`, totalsX + totalsBoxW - 4, y + 30, { align: 'right' });

    y += 42;

    // ── Footer Note ──
    if (y + 20 > doc.internal.pageSize.getHeight() - 10) {
      doc.addPage();
      y = 14;
    }
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('This is a system-generated proforma invoice. Prices are subject to change. For queries, contact our sales desk.', margin, y);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, margin, y + 5);

    // Save
    doc.save(`Order_${submittedPi}_${buyerName.replace(/\s+/g, '_')}.pdf`);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10 space-y-6 text-center">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-1.5">
            <Badge variant="success" className="text-xs font-semibold px-3 py-1">
              Order Confirmed & Proforma Generated
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Your material order has been booked directly with <strong className="text-slate-800">{form.organization.name}</strong>.
            </p>
          </div>

          {/* Order Details Receipt Box */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-left text-xs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Proforma Invoice No:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded text-sm">
                {submittedPi}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Customer / Firm:</span>
              <span className="font-semibold text-slate-800">{buyerName}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Contact Phone:</span>
              <span className="font-semibold text-slate-800">{contactNumber}</span>
            </div>

            {deliveryAddress && (
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Delivery Destination:</span>
                <span className="font-semibold text-slate-800 text-right max-w-xs">{deliveryAddress}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Base Subtotal:</span>
                <span className="font-semibold">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (CGST + SGST):</span>
                <span className="font-semibold">₹{totals.totalGst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Total Amount Payable:</span>
                <span className="text-blue-700">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Our dispatch desk has logged this order. You will receive an official dispatch schedule and payment confirmation call shortly.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button 
              onClick={generateOrderPDF}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-10 px-5 shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Order PDF
            </Button>

            <Button 
              onClick={() => {
                setSubmitted(false);
                setCart({});
                setBuyerName('');
                setContactNumber('');
                setDeliveryAddress('');
                setGstin('');
                setAdditionalNotes('');
              }}
              variant="outline"
              className="w-full sm:w-auto rounded-xl text-xs h-10 px-5"
            >
              Place Another Order
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans pb-36">
      
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-none">{form.organization.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">Official Solar Material Order Booking Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Live Pricing & GST Auto-Calculated</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 space-y-6">
        
        {/* Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs relative overflow-hidden space-y-2">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
            <ReceiptText className="h-3.5 w-3.5" />
            <span>Direct Order Booking & Proforma Generation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Material Order Form
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            Select your required equipment quantities from the items below. As you enter quantities, your line amounts, GST (CGST/SGST), and total payable are calculated in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Buyer Information Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Customer & Delivery Details</span>
              </h2>
              <span className="text-xs text-slate-400">* Required for Proforma Invoice</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Full Name / Business Firm Name *</Label>
                <Input 
                  required
                  placeholder="e.g. Apex Solar Solutions / Ramesh Patel"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="rounded-xl text-xs h-10 border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Mobile / WhatsApp Number *</Label>
                <Input 
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="rounded-xl text-xs h-10 border-slate-200"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Delivery Site Address & Destination Pincode *</Label>
                <Input 
                  required
                  placeholder="e.g. Site 4, Industrial Area, Noida, UP - 201301"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="rounded-xl text-xs h-10 border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">GSTIN Number (Optional - For Tax Input Credit)</Label>
                <Input 
                  placeholder="e.g. 07AAACS1234Q1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="rounded-xl text-xs h-10 border-slate-200 uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Order Notes / Unloading Instructions</Label>
                <Input 
                  placeholder="e.g. Need 40ft trailer access, call before dispatch"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="rounded-xl text-xs h-10 border-slate-200"
                />
              </div>
            </div>
          </div>

          {/* 2. Products Table Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>Select Materials & Enter Quantities</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type quantity directly or use the stepper buttons.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Filter materials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => {
                const count = cat === 'ALL' ? (form.products || []).length : (categoryCounts[cat] || 0);
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Products Table */}
            <div className="hidden sm:block border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">S.No.</th>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Base Rate (₹)</th>
                    <th className="py-3 px-4 text-center">GST %</th>
                    <th className="py-3 px-4 text-right">Rate incl. GST (₹)</th>
                    <th className="py-3 px-4 text-center w-32">Quantity</th>
                    <th className="py-3 px-4 text-right">Tax Amt (₹)</th>
                    <th className="py-3 px-4 text-right">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product, idx) => {
                    const qty = cart[product.id] || 0;
                    const isSelected = qty > 0;
                    const lineBase = product.baseRate * qty;
                    const lineTax = lineBase * (product.gstPercent / 100);
                    const lineTotal = lineBase + lineTax;

                    return (
                      <tr 
                        key={product.id} 
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* S.No */}
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Item Description */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {product.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {product.sku} • {product.category}
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap">
                          {product.unit}
                        </td>

                        {/* Base Rate */}
                        <td className="py-3 px-4 text-right font-semibold text-slate-800 whitespace-nowrap">
                          ₹{product.baseRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* GST % */}
                        <td className="py-3 px-4 text-center text-slate-500 whitespace-nowrap text-[11px]">
                          {product.gstPercent}%
                        </td>

                        {/* Rate incl. GST */}
                        <td className="py-3 px-4 text-right font-bold text-blue-700 whitespace-nowrap">
                          ₹{(product.baseRate * (1 + product.gstPercent / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Quantity Stepper + Input */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white p-0.5 shadow-xs">
                            <button
                              type="button"
                              onClick={() => updateCart(product.id, qty - 1)}
                              disabled={qty === 0}
                              className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 transition-all"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            
                            <input 
                              type="number"
                              min="0"
                              value={qty === 0 ? '' : qty}
                              placeholder="0"
                              onChange={(e) => updateCart(product.id, parseInt(e.target.value) || 0)}
                              className="w-14 text-center font-bold text-xs text-slate-900 border-none outline-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            <button
                              type="button"
                              onClick={() => updateCart(product.id, qty + 1)}
                              className="h-7 w-7 rounded flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Per-Product Tax Amount */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {qty > 0 ? (
                            <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-1.5 py-0.5 rounded">
                              ₹{lineTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Line Total */}
                        <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                          {qty > 0 ? (
                            <span className="text-blue-700 text-sm">
                              ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Products List */}
            <div className="sm:hidden space-y-3">
              {filteredProducts.map((product) => {
                const qty = cart[product.id] || 0;
                const isSelected = qty > 0;
                const finalRate = product.baseRate * (1 + product.gstPercent / 100);
                const lineBase = product.baseRate * qty;
                const lineTax = lineBase * (product.gstPercent / 100);
                const lineTotal = lineBase + lineTax;

                return (
                  <div key={product.id} className={`p-4 rounded-xl border transition-colors ${isSelected ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="pr-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{product.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">{product.sku} • {product.category}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg shrink-0">
                        ₹{finalRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{product.unit.replace('per ', '')}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          Base: ₹{product.baseRate.toLocaleString()} <span className="mx-1 text-slate-300">•</span> GST: {product.gstPercent}%
                        </div>
                        
                        {/* Mobile Quantity Stepper */}
                        <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateCart(product.id, qty - 1)}
                            disabled={qty === 0}
                            className="h-8 w-8 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 transition-all"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          
                          <input 
                            type="number"
                            min="0"
                            value={qty === 0 ? '' : qty}
                            placeholder="0"
                            onChange={(e) => updateCart(product.id, parseInt(e.target.value) || 0)}
                            className="w-14 text-center font-bold text-sm text-slate-900 border-none outline-none p-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />

                          <button
                            type="button"
                            onClick={() => updateCart(product.id, qty + 1)}
                            className="h-8 w-8 rounded flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Mobile Tax & Line Total */}
                      {qty > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-amber-50/60 p-2 rounded-lg border border-amber-100/50">
                            <span className="text-[11px] font-semibold text-amber-800">GST Tax ({product.gstPercent}%)</span>
                            <span className="text-xs font-bold text-amber-700">
                              ₹{lineTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-blue-50/50 p-2.5 rounded-lg border border-blue-100/50">
                            <span className="text-xs font-semibold text-blue-800">Line Total (incl. GST)</span>
                            <span className="text-sm font-extrabold text-blue-700">
                              ₹{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Live Total Calculation Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Order Pricing Breakdown (GST Compliant)
            </h3>

            <div className="space-y-2 pt-2 border-t border-slate-100 max-w-md ml-auto text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Selected:</span>
                <span className="font-semibold text-slate-800">{totals.itemsCount} materials ({totals.unitsCount} total units)</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Taxable Base Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>CGST:</span>
                <span className="font-semibold text-slate-800">₹{totals.cgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>SGST:</span>
                <span className="font-semibold text-slate-800">₹{totals.sgst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t-2 border-slate-900">
                <span>Total Amount Payable:</span>
                <span className="text-blue-700">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

        </form>

      </main>

      {/* Floating Sticky Bottom Bar */}
      <aside aria-label="Order summary footer" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-3.5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500">
                {totals.itemsCount} Items ({totals.unitsCount} Units) • GST Included
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                ₹{totals.grandTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                <span className="text-xs font-normal text-slate-500 ml-1.5">Total Amount</span>
              </div>
            </div>
          </div>

          <Button 
            type="button"
            onClick={() => {
              const formEl = document.querySelector('form');
              if (formEl) formEl.requestSubmit();
            }}
            disabled={submitting || totals.unitsCount === 0} 
            className="h-11 px-7 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shrink-0"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Booking Order...</span>
              </>
            ) : (
              <>
                <span>Place Order & Generate Proforma Invoice (PI)</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

        </div>
      </aside>

    </div>
  );
}
