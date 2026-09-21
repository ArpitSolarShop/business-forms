"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  RotateCcw, 
  Plus, 
  ExternalLink, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  ArrowLeft,
  Loader2,
  Package
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  category: string;
  unit: string;
  gstPercent: number;
  baseRate: number;
  inStock: boolean;
};

const CATEGORIES = [
  'All',
  'G.I. Solar Mounting Structure',
  'Clamps & Joiners',
  'Fasteners & Hardware',
  'Earthing & Lightning',
  'Electrical Panels',
  'Accessories',
  'Wires & Cables',
  'Solar Structure Kit'
];

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals & Editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Inline quick editing for rate or GST
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>('');
  const [editingGstId, setEditingGstId] = useState<string | null>(null);
  const [tempGst, setTempGst] = useState<string>('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'G.I. Solar Mounting Structure',
    unit: 'Pcs',
    gstPercent: '18',
    baseRate: '',
    inStock: true,
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all 37 components and rates back to official catalog defaults?")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch('/api/products/reset', { method: 'POST' });
      if (res.ok) {
        await fetchProducts();
      } else {
        alert("Failed to reset catalog defaults.");
      }
    } catch (e) {
      alert("Error resetting defaults");
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: 'G.I. Solar Mounting Structure',
      unit: 'Pcs',
      gstPercent: '18',
      baseRate: '1',
      inStock: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      gstPercent: String(p.gstPercent),
      baseRate: String(p.baseRate),
      inStock: p.inStock,
    });
    setShowAddModal(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      alert("Name and SKU Code are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingProduct) {
        // PATCH
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            baseRate: parseFloat(formData.baseRate) || 1,
            gstPercent: parseFloat(formData.gstPercent) || 18,
          })
        });
        if (res.ok) {
          setShowAddModal(false);
          fetchProducts();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to update component");
        }
      } else {
        // POST
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            baseRate: parseFloat(formData.baseRate) || 1,
            gstPercent: parseFloat(formData.gstPercent) || 18,
          })
        });
        if (res.ok) {
          setShowAddModal(false);
          fetchProducts();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to create component");
        }
      }
    } catch (e) {
      alert("Error saving component");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the catalog?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete component.");
      }
    } catch (e) {
      alert("Error deleting component");
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !product.inStock })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, inStock: !p.inStock } : p));
      }
    } catch (e) {
      alert("Error updating stock");
    }
  };

  const handleSaveInlineRate = async (product: Product) => {
    const rateVal = parseFloat(tempRate);
    if (isNaN(rateVal) || rateVal < 0) {
      alert("Please enter a valid rate number.");
      return;
    }
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseRate: rateVal })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, baseRate: rateVal } : p));
        setEditingRateId(null);
      }
    } catch (e) {
      alert("Error updating rate");
    }
  };

  const handleSaveInlineGst = async (product: Product) => {
    const gstVal = parseFloat(tempGst);
    if (isNaN(gstVal) || gstVal < 0) {
      alert("Please enter a valid GST percentage.");
      return;
    }
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstPercent: gstVal })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, gstPercent: gstVal } : p));
        setEditingGstId(null);
      }
    } catch (e) {
      alert("Error updating GST");
    }
  };

  // KPI Calculations matching the image
  const totalCount = products.length;
  const mountingCount = products.filter(p => p.category === 'G.I. Solar Mounting Structure' || p.category === 'Solar Structure Kit').length;
  const clampsCount = products.filter(p => p.category === 'Clamps & Joiners' || p.category === 'Fasteners & Hardware').length;
  const wiresCount = products.filter(p => p.category === 'Wires & Cables' || p.category === 'Electrical Panels' || p.category === 'Earthing & Lightning' || p.category === 'Accessories').length;

  // Filtered list
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
                        p.sku.toLowerCase().includes(search.toLowerCase()) ||
                        p.category.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        
        {/* Top Header Row matching image */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link 
              href="/"
              className="mt-1 h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                B2B Structure Catalog Manager
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Full catalog of 37 solar components, electricals & mounting structures ready for Quotations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Reset Defaults button */}
            <Button
              onClick={handleResetDefaults}
              disabled={isResetting}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold h-9 px-3 flex items-center gap-1.5"
            >
              <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Defaults</span>
            </Button>

            {/* Add Component button */}
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Component</span>
            </Button>

            {/* Go to Quotation Builder button */}
            <Link href="/forms/new">
              <Button
                size="sm"
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5"
              >
                <span>Go to Quotation Builder</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 KPI Metric Cards with Accents matching image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: 37 Active Structure SKUs */}
          <div className="bg-white border-t-4 border-t-amber-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Active Structure SKUs</div>
          </div>

          {/* Card 2: 7 Mounting Structure Sections */}
          <div className="bg-white border-t-4 border-t-blue-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{mountingCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Mounting Structure Sections</div>
          </div>

          {/* Card 3: 7 Clamps Fasteners & Joiners */}
          <div className="bg-white border-t-4 border-t-teal-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{clampsCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Clamps Fasteners & Joiners</div>
          </div>

          {/* Card 4: 21 Wires Panels & Earthing */}
          <div className="bg-white border-t-4 border-t-purple-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{wiresCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Wires Panels & Earthing</div>
          </div>

        </div>

        {/* Search & Filter Controls matching image */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
          
          {/* Search bar with item count on right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by product name, SKU, or specs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium shrink-0">
              Showing {filteredProducts.length} of {products.length} items
            </span>
          </div>

          {/* Filter pills matching image */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

        </div>

        {/* Master Catalog Table matching image */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          
          {loading ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs text-slate-500">Loading B2B structure components...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No components found matching &quot;{search}&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-center">GST %</th>
                    <th className="py-3 px-4 text-right">Base Rate (₹)</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isEditingRate = editingRateId === p.id;
                    const isEditingGst = editingGstId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Product Name & Subtitle Specs */}
                        <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                              {p.description}
                            </div>
                          )}
                        </td>

                        {/* SKU Code (Blue Pill Badge) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200/80">
                            {p.sku}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                          {p.category}
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700 whitespace-nowrap">
                          {p.unit}
                        </td>

                        {/* GST % with edit pencil */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isEditingGst ? (
                            <div className="inline-flex items-center gap-1">
                              <input 
                                type="number"
                                autoFocus
                                value={tempGst}
                                onChange={(e) => setTempGst(e.target.value)}
                                className="w-14 h-6 text-center text-xs font-bold border border-blue-500 rounded"
                              />
                              <button onClick={() => handleSaveInlineGst(p)} className="text-emerald-600 hover:text-emerald-700">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingGstId(null)} className="text-slate-400">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGstId(p.id);
                                setTempGst(String(p.gstPercent));
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs border border-blue-200 transition-colors"
                              title="Click to edit GST %"
                            >
                              <span>{p.gstPercent}%</span>
                              <Pencil className="h-2.5 w-2.5 opacity-60" />
                            </button>
                          )}
                        </td>

                        {/* Base Rate (₹) with edit pencil */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                          {isEditingRate ? (
                            <div className="inline-flex items-center justify-end gap-1">
                              <span>₹</span>
                              <input 
                                type="number"
                                step="0.01"
                                autoFocus
                                value={tempRate}
                                onChange={(e) => setTempRate(e.target.value)}
                                className="w-20 h-6 text-right text-xs font-bold border border-blue-500 rounded px-1"
                              />
                              <button onClick={() => handleSaveInlineRate(p)} className="text-emerald-600 hover:text-emerald-700">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingRateId(null)} className="text-slate-400">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRateId(p.id);
                                setTempRate(String(p.baseRate));
                              }}
                              className="inline-flex items-center justify-end gap-1 text-slate-900 hover:text-blue-700 group"
                              title="Click to edit Base Rate"
                            >
                              <span>₹{p.baseRate.toLocaleString()}</span>
                              <Pencil className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 text-blue-600" />
                            </button>
                          )}
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleStock(p)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                              p.inStock
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle stock status"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                          </button>
                        </td>

                        {/* Actions (Blue Pencil + Red Trash) */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit Component"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete Component"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </main>

      {/* Add / Edit Component Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Structure Component' : 'Add New Structure Component'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Product Name *</Label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AC Wire 4MM HPL"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Description / Specifications</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. HPL 4 sq mm Copper AC Cable (Rate per meter)"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">SKU Code *</Label>
                  <Input 
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. APL-ACW-4H"
                    className="rounded-xl text-xs uppercase font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Category *</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 text-xs px-2.5 bg-white text-slate-800"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Unit *</Label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 text-xs px-2.5 bg-white text-slate-800"
                  >
                    <option value="Mtr">Mtr</option>
                    <option value="Pcs">Pcs</option>
                    <option value="BDL">BDL</option>
                    <option value="KG">KG</option>
                    <option value="Pair">Pair</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Base Rate (₹) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                    placeholder="Rate"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">GST % *</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    required
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input 
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Mark as In Stock</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAddModal(false)}
                    className="text-xs text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4"
                  >
                    {isSaving ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Create Component')}
                  </Button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
