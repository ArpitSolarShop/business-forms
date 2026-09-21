"use client";

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Clock, 
  HelpCircle,
  ArrowRight,
  Sparkles,
  Filter,
  Check,
  Package,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description?: string | null;
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
  const [submittedRfq, setSubmittedRfq] = useState<string>('');
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [respondent, setRespondent] = useState('');
  
  // Product cart state
  const [cart, setCart] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

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

  const getCartTotals = () => {
    if (!form || !form.products) return { subtotal: 0, items: 0, distinctItems: 0, gst: 0, total: 0, quoteOnRequestCount: 0 };
    
    let subtotal = 0;
    let items = 0;
    let distinctItems = 0;
    let gst = 0;
    let quoteOnRequestCount = 0;

    Object.entries(cart).forEach(([id, qty]) => {
      if (qty <= 0) return;
      const product = form.products.find(p => p.id === id);
      if (product) {
        items += qty;
        distinctItems += 1;
        if (product.baseRate > 1) {
          const lineTotal = product.baseRate * qty;
          subtotal += lineTotal;
          gst += lineTotal * (product.gstPercent / 100);
        } else {
          quoteOnRequestCount += 1;
        }
      }
    });

    return { 
      subtotal, 
      items, 
      distinctItems, 
      gst, 
      total: subtotal + gst,
      quoteOnRequestCount
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    if (!respondent.trim()) {
      alert("Please provide your Primary Contact / Business Email or Phone Number.");
      return;
    }

    // Validate required fields
    for (const field of form.fields) {
      if (field.type === 'PRODUCT_TABLE') {
        if (field.required && Object.keys(cart).length === 0) {
          alert(`Please select quantities for at least one item under "${field.label}"`);
          return;
        }
      } else if (field.required && !answers[field.id]) {
        alert(`Please complete the required field: "${field.label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([fieldId, value]) => ({
        fieldId,
        value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
      }));

      // Inject the cart JSON as an answer for the PRODUCT_TABLE field if it exists
      const productField = form.fields.find(f => f.type === 'PRODUCT_TABLE');
      if (productField && Object.keys(cart).length > 0) {
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
          respondent,
          answers: formattedAnswers
        })
      });

      if (res.ok) {
        const result = await res.json();
        setSubmittedRfq(result.rfqNumber || 'RFQ-ORDER-CONFIRMED');
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert("Failed to submit quotation request. Please check required fields and try again.");
      }
    } catch (error) {
      alert("Network error submitting RFQ. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Procurement Portal...
        </span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Form Not Available</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          This portal does not exist, has expired, or the access link is invalid.
        </p>
      </div>
    );
  }

  const totals = getCartTotals();
  const hasProducts = form.fields.some(f => f.type === 'PRODUCT_TABLE');

  // Categories with counts
  const categoryCounts: Record<string, number> = {};
  (form.products || []).forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const categories = ['ALL', ...Object.keys(categoryCounts)];

  const filteredProducts = (form.products || []).filter(product => {
    const qty = cart[product.id] || 0;
    if (showSelectedOnly && qty === 0) return false;

    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" className="text-xs font-semibold px-3 py-1">
              Quotation Order Transmitted
            </Badge>
            <h1 className="text-2xl font-bold text-slate-900">Quotation Request Received!</h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              Your equipment requirements have been sent to <strong className="text-slate-800">{form.organization.name}</strong> commercial team.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-5 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">RFQ Reference Number:</span>
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{submittedRfq}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Vendor / Contact:</span>
              <span className="font-semibold text-slate-800">{respondent}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
              <span className="text-slate-500 font-medium">Materials Selected:</span>
              <span className="font-semibold text-slate-800">{totals.distinctItems} Items ({totals.items} Units)</span>
            </div>
            {totals.subtotal > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Est. Fixed Base Amount:</span>
                <span className="font-semibold text-slate-900">₹{totals.subtotal.toLocaleString()} + 18% GST</span>
              </div>
            )}
            {totals.quoteOnRequestCount > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-200/60 mt-2">
                * Note: {totals.quoteOnRequestCount} custom item(s) marked for best batch quotation by sales manager.
              </p>
            )}
          </div>

          <div className="text-xs text-slate-400">
            An official GST Proforma Invoice & Dispatch timeline will be issued directly to your email/WhatsApp.
          </div>

          <Button 
            onClick={() => {
              setSubmitted(false);
              setCart({});
              setAnswers({});
              setRespondent('');
            }}
            variant="outline"
            className="rounded-xl text-xs"
          >
            Submit Another RFQ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50/80 font-sans ${hasProducts ? 'pb-36' : 'pb-16'}`}>
      
      {/* Top Professional Header Bar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-none">{form.organization.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">Wholesale Procurement & RFQ Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-medium text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Verified GST Invoicing</span>
          </div>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Form Hero Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-6 sm:p-8 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500" />
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
              <Sparkles className="h-3 w-3" />
              <span>Commercial Vendor Inquiry & Quotation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-slate-600 text-sm leading-relaxed pt-1">
                {form.description}
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Quotes issued same day</span>
            </span>
            <span>•</span>
            <span>All catalog rates are exclusive of GST</span>
            <span>•</span>
            <span>Bulk volume discounts applied at billing</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Primary Vendor Identifier */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-6 space-y-4">
            <div>
              <Label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Your Official Email or WhatsApp Mobile Number</span>
                <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-slate-500 mt-0.5">
                We will send the official PDF Proforma quotation and dispatch timeline here.
              </p>
            </div>

            <Input 
              required
              placeholder="e.g. +91 98765 43210 or procurement@company.com"
              value={respondent}
              onChange={(e) => setRespondent(e.target.value)}
              className="h-11 rounded-xl text-sm border-slate-200 focus-visible:ring-indigo-500 font-medium text-slate-900 pl-3"
            />
          </div>

          {/* Form Dynamic Fields */}
          {form.fields.map((field) => (
            <div key={field.id} className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-6 space-y-4">
              
              <div className="space-y-1">
                <Label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{field.label}</span>
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.placeholder && field.type !== 'PRODUCT_TABLE' && (
                  <p className="text-xs text-slate-400">{field.placeholder}</p>
                )}
              </div>

              {/* FIELD TYPE: SHORT TEXT */}
              {field.type === 'TEXT' && (
                <Input 
                  required={field.required}
                  placeholder={field.placeholder || "Your answer"}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-500"
                />
              )}

              {/* FIELD TYPE: PARAGRAPH */}
              {field.type === 'PARAGRAPH' && (
                <Textarea 
                  required={field.required}
                  placeholder={field.placeholder || "Enter details..."}
                  value={answers[field.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [field.id]: e.target.value })}
                  className="rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-500 resize-none min-h-[90px]"
                />
              )}

              {/* FIELD TYPE: PRODUCT CATALOG / WHOLESALE ORDER TABLE */}
              {field.type === 'PRODUCT_TABLE' && form.products && (
                <div className="space-y-5 pt-1">
                  
                  {/* Search Bar & Selected Items Filter Toggle */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Search by name or SKU (e.g. 4MM HPL, ACDB, Earthing Rod)..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 rounded-xl text-xs border-slate-200 bg-slate-50 focus-visible:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                      className={`h-10 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                        showSelectedOnly 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Selected Only ({totals.distinctItems})</span>
                    </button>
                  </div>

                  {/* Category Filter Pills with Item Counts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                    {categories.map((cat) => {
                      const count = cat === 'ALL' ? (form.products || []).length : (categoryCounts[cat] || 0);
                      const isSelected = selectedCategory === cat;

                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowSelectedOnly(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Products Grid / List */}
                  <div className="space-y-3">
                    {filteredProducts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                        <Package className="h-6 w-6 mx-auto text-slate-300" />
                        <p>No materials found matching criteria.</p>
                        {showSelectedOnly && (
                          <button 
                            type="button" 
                            onClick={() => setShowSelectedOnly(false)} 
                            className="text-indigo-600 font-semibold hover:underline"
                          >
                            View all items
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const qty = cart[product.id] || 0;
                        const isQuoteOnRequest = product.baseRate <= 1;
                        const lineTotal = product.baseRate * qty;

                        return (
                          <div 
                            key={product.id} 
                            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                              qty > 0 
                                ? 'border-indigo-400 bg-indigo-50/25 shadow-xs' 
                                : 'border-slate-200/90 bg-slate-50/40 hover:bg-slate-50'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900">{product.name}</h4>
                                <span className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                  {product.sku}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({product.category})
                                </span>
                              </div>
                              {product.description && (
                                <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                  {product.description}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs">
                                {isQuoteOnRequest ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                                    Rate on Request (RFQ)
                                  </span>
                                ) : (
                                  <span className="font-bold text-indigo-700">
                                    ₹{product.baseRate.toLocaleString()} <span className="font-normal text-slate-500">/ {product.unit}</span>
                                  </span>
                                )}

                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] text-slate-500">
                                  Unit: <strong className="text-slate-700">{product.unit}</strong> | GST: 18%
                                </span>

                                {qty > 0 && !isQuoteOnRequest && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                                      Total: ₹{lineTotal.toLocaleString()}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Quantity Selector: Stepper + Direct Typing Input! */}
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200/90 rounded-xl p-1 shadow-xs self-end sm:self-center shrink-0">
                              <button 
                                type="button" 
                                onClick={() => updateCart(product.id, qty - 1)}
                                disabled={qty === 0}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              
                              <div className="flex items-center gap-1 px-1">
                                <input 
                                  type="number" 
                                  min="0"
                                  value={qty === 0 ? '' : qty} 
                                  placeholder="0"
                                  onChange={(e) => updateCart(product.id, parseInt(e.target.value) || 0)}
                                  className="w-14 text-center font-black text-sm text-slate-900 border-none outline-none focus:ring-0 p-0 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="text-[10px] text-slate-400 font-semibold">{product.unit}</span>
                              </div>

                              <button 
                                type="button" 
                                onClick={() => updateCart(product.id, qty + 1)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 transition-all"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}

            </div>
          ))}

          {/* Direct Submit Button (If not product table) */}
          {!hasProducts && (
            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full sm:w-auto px-8 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm text-sm font-semibold"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          )}

        </form>

      </main>

      {/* Floating Bottom Commercial Summary Bar */}
      {hasProducts && (
        <aside aria-label="Commercial order summary" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-3 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {totals.distinctItems} Items ({totals.items} Units)
                  </span>
                  {totals.quoteOnRequestCount > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-semibold text-amber-700">
                        {totals.quoteOnRequestCount} custom quote
                      </span>
                    </>
                  )}
                  {totals.subtotal > 0 && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        +18% GST (₹{totals.gst.toLocaleString(undefined, { maximumFractionDigits: 0 })})
                      </span>
                    </>
                  )}
                </div>

                <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  {totals.subtotal > 0 ? (
                    <>
                      ₹{totals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-xs font-normal text-slate-500 ml-1.5">
                        {totals.quoteOnRequestCount > 0 ? 'Est. Fixed Total (+ RFQ items)' : 'Est. Total with GST'}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-800">
                      Rates to be Quoted on Submission
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="button"
              onClick={() => {
                const formElement = document.querySelector('form');
                if (formElement) formElement.requestSubmit();
              }}
              disabled={submitting || totals.items === 0} 
              className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl shadow-md shadow-indigo-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting RFQ...</span>
                </>
              ) : (
                <>
                  <span>Request Official Quotation</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

          </div>
        </aside>
      )}

    </div>
  );
}
