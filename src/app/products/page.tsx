"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  RotateCcw, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  ArrowLeft,
  Loader2,
  CheckCircle2
} from 'lucide-react';

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  gstPercent: number;
  baseRate: number;
  inStock: boolean;
};

const CATEGORIES = [
  'All',
  'Wires & Cables',
  'G.I. Solar Mounting Structure',
  'Earthing & Lightning',
  'Clamps & Joiners',
  'Electrical Panels',
  'Fasteners & Hardware',
  'Accessories'
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

  // Inline quick editing for rate
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Wires & Cables',
    unit: 'piece',
    gstPercent: '18',
    baseRate: '',
    inStock: true,
  });

  const fetchProducts = async () => {
    try {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, []);

  const handleResetDefaults = async () => {
    if (!confirm("Reset catalog back to the official 23 solar items and rates?")) {
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
      sku: '',
      category: 'Wires & Cables',
      unit: 'piece',
      gstPercent: '18',
      baseRate: '100',
      inStock: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
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
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            baseRate: parseFloat(formData.baseRate) || 0,
            gstPercent: parseFloat(formData.gstPercent) || 18,
          })
        });
        if (res.ok) {
          setShowAddModal(false);
          fetchProducts();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to update product");
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            baseRate: parseFloat(formData.baseRate) || 0,
            gstPercent: parseFloat(formData.gstPercent) || 18,
          })
        });
        if (res.ok) {
          setShowAddModal(false);
          fetchProducts();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to create product");
        }
      }
    } catch (e) {
      alert("Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from the catalog?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
      } else {
        alert("Failed to delete product.");
      }
    } catch (e) {
      alert("Error deleting product");
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
      alert("Please enter a valid rate.");
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

  // KPI Calculations
  const totalCount = products.length;
  const mountingCount = products.filter(p => p.category === 'G.I. Solar Mounting Structure').length;
  const clampsCount = products.filter(p => p.category === 'Clamps & Joiners' || p.category === 'Fasteners & Hardware').length;
  const electricalCount = products.filter(p => p.category === 'Wires & Cables' || p.category === 'Electrical Panels' || p.category === 'Earthing & Lightning' || p.category === 'Accessories').length;

  // Filtered list
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase()) ||
                        p.category.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans flex flex-col pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        
        {/* Top Header Row */}
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
                Official catalog of 23 solar components, electricals & mounting structures.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
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

            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold h-9 px-3.5 flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Component</span>
            </Button>

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

        {/* 4 Clean KPI Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-t-4 border-t-amber-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Active Structure SKUs</div>
          </div>

          <div className="bg-white border-t-4 border-t-blue-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{mountingCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Mounting Structure Sections</div>
          </div>

          <div className="bg-white border-t-4 border-t-teal-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{clampsCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Clamps & Fasteners</div>
          </div>

          <div className="bg-white border-t-4 border-t-purple-500 border-x border-b border-slate-200/90 rounded-xl p-4 shadow-xs">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{electricalCount}</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Wires, Panels & Earthing</div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by product name, SKU, or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium shrink-0">
              Showing {filteredProducts.length} of {products.length} items
            </span>
          </div>

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

        {/* 23 Items Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs text-slate-500">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No items found matching &quot;{search}&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">S.No.</th>
                    <th className="py-3 px-4">Item Description</th>
                    <th className="py-3 px-4">SKU Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-center">GST (%)</th>
                    <th className="py-3 px-4 text-right">Rate (₹)</th>
                    <th className="py-3 px-4 text-center">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p, index) => {
                    const isEditingRate = editingRateId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-medium">
                          {index + 1}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {p.name}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200/80">
                            {p.sku}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                          {p.category}
                        </td>

                        <td className="py-3.5 px-4 text-center font-medium text-slate-700 whitespace-nowrap">
                          {p.unit}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200">
                            {p.gstPercent}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                          {isEditingRate ? (
                            <div className="inline-flex items-center justify-end gap-1">
                              <span>₹</span>
                              <input 
                                type="number"
                                step="1"
                                autoFocus
                                value={tempRate}
                                onChange={(e) => setTempRate(e.target.value)}
                                className="w-20 h-6 text-right text-xs font-bold border border-blue-500 rounded px-1"
                              />
                              <button onClick={() => handleSaveInlineRate(p)} className="text-emerald-600 hover:text-emerald-700 p-0.5">
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => setEditingRateId(null)} className="text-slate-400 p-0.5">
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
                              className="inline-flex items-center justify-end gap-1 text-slate-900 hover:text-blue-700 font-bold group"
                              title="Click to edit Rate"
                            >
                              <span>₹{p.baseRate.toLocaleString()}</span>
                              <Pencil className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 text-blue-600" />
                            </button>
                          )}
                        </td>

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

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit Item"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete Item"
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

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Item' : 'Add Item'}
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
                <label className="text-xs font-semibold text-slate-700">Item Description *</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. AC wire 4MM HPL"
                  className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">SKU Code *</label>
                  <input 
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. APL-ACW-4H"
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs uppercase font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Category *</label>
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
                  <label className="text-xs font-semibold text-slate-700">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 text-xs px-2.5 bg-white text-slate-800"
                  >
                    <option value="per mtr">per mtr</option>
                    <option value="piece">piece</option>
                    <option value="per pair">per pair</option>
                    <option value="per kg">per kg</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Rate (₹) *</label>
                  <input 
                    type="number"
                    step="1"
                    required
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                    placeholder="Rate"
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">GST (%) *</label>
                  <input 
                    type="number"
                    step="1"
                    required
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 px-3 text-xs"
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
                  <span>In Stock</span>
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
                    {isSaving ? 'Saving...' : (editingProduct ? 'Save Changes' : 'Add Item')}
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
