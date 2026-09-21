"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Package, 
  Plus, 
  Search, 
  Check, 
  X, 
  Edit2, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  Loader2,
  RefreshCw
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

export default function ProductCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Add product form visibility
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  
  // New product state
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Wires & Cables',
    unit: 'Mtr',
    baseRate: '',
    gstPercent: '18',
  });

  // Inline editing state for product rate
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) {
      alert("Name and SKU Code are required.");
      return;
    }

    setSavingProduct(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          baseRate: parseFloat(newProduct.baseRate) || 1,
          gstPercent: parseFloat(newProduct.gstPercent) || 18,
        })
      });

      if (res.ok) {
        setShowAddForm(false);
        setNewProduct({
          name: '',
          sku: '',
          category: 'Wires & Cables',
          unit: 'Mtr',
          baseRate: '',
          gstPercent: '18',
        });
        fetchProducts();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add product");
      }
    } catch (e) {
      alert("Error adding product");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    setUpdatingId(product.id);
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
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveRate = async (product: Product) => {
    const rateVal = parseFloat(editRate);
    if (isNaN(rateVal) || rateVal < 0) {
      alert("Please enter a valid rate (e.g. 55 or 1 for Quote on Request).");
      return;
    }

    setUpdatingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseRate: rateVal })
      });
      if (res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, baseRate: rateVal } : p));
        setEditingId(null);
      }
    } catch (e) {
      alert("Error updating rate");
    } finally {
      setUpdatingId(null);
    }
  };

  // Categories list & counts
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  const categories = ['ALL', ...Object.keys(categoryCounts)];

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.sku.toLowerCase().includes(search.toLowerCase()) ||
                        p.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const inStockCount = products.filter(p => p.inStock).length;
  const quoteOnRequestCount = products.filter(p => p.baseRate <= 1).length;

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Top Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inventory & Pricing</span>
              <span className="text-slate-300">•</span>
              <Badge variant="purple" className="text-[10px] py-0">B2B Wholesale Master</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Product Catalog Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live pricing and inventory synced directly with your customer quotation forms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-semibold h-10 px-4 flex items-center gap-2"
            >
              {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>{showAddForm ? 'Close Form' : 'Add New Equipment'}</span>
            </Button>
          </div>
        </div>

        {/* Quick KPI Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{products.length}</div>
            <span className="text-[11px] text-slate-500">Across {Object.keys(categoryCounts).length} categories</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Stock Ready</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{inStockCount}</div>
            <span className="text-[11px] text-emerald-700">Available for immediate quotation</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fixed Price Items</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">{products.length - quoteOnRequestCount}</div>
            <span className="text-[11px] text-slate-500">Auto-calculated subtotal</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rate on Request</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{quoteOnRequestCount}</div>
            <span className="text-[11px] text-amber-700">Requires custom batch quote</span>
          </div>
        </div>

        {/* Clean "Add Product" Slide-In Form */}
        {showAddForm && (
          <form onSubmit={handleAddProduct} className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Add New Solar Equipment to Catalog</h3>
              </div>
              <span className="text-xs text-slate-400">* All items sync to customer quotation forms</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Equipment Name & Description *</Label>
                <Input 
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. DC Cable 6MM Polycab (Tinned Copper)"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">SKU Code *</Label>
                <Input 
                  required
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="e.g. APL-DCW-6P"
                  className="rounded-xl text-xs uppercase font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Category *</Label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800"
                >
                  <option value="Wires & Cables">Wires & Cables</option>
                  <option value="G.I. Solar Mounting Structure">G.I. Solar Mounting Structure</option>
                  <option value="Clamps & Joiners">Clamps & Joiners</option>
                  <option value="Electrical Panels">Electrical Panels</option>
                  <option value="Earthing & Lightning">Earthing & Lightning</option>
                  <option value="Fasteners & Hardware">Fasteners & Hardware</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Unit of Measurement *</Label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-full h-9 rounded-xl border border-slate-200 text-xs px-3 bg-white text-slate-800"
                >
                  <option value="Mtr">Mtr (Meters)</option>
                  <option value="Pcs">Pcs (Pieces)</option>
                  <option value="BDL">BDL (Bundle)</option>
                  <option value="KG">KG (Kilograms)</option>
                  <option value="Pair">Pair</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">Base Unit Rate (₹) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={newProduct.baseRate}
                  onChange={(e) => setNewProduct({ ...newProduct, baseRate: e.target.value })}
                  placeholder="Set 1 for 'Rate on Request'"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={savingProduct}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs px-4"
              >
                {savingProduct ? 'Saving...' : 'Add Equipment'}
              </Button>
            </div>
          </form>
        )}

        {/* Search & Category Filter Controls */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search catalog by name or SKU (e.g. 4MM HPL, ACDB, Rafter)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs border-slate-200 bg-slate-50"
              />
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchProducts} 
              className="rounded-xl border-slate-200 text-xs h-10 px-3 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => {
              const count = cat === 'ALL' ? products.length : (categoryCounts[cat] || 0);
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
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

        </div>

        {/* Clean, Organized Catalog Table */}
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          
          {loading ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs text-slate-500">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No products found matching &quot;{search}&quot;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Item & SKU Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-right">Base Rate (₹)</th>
                    <th className="py-3 px-4 text-center">GST %</th>
                    <th className="py-3 px-4 text-center">Stock Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isEditing = editingId === p.id;
                    const isQuoteOnRequest = p.baseRate <= 1;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        
                        {/* Name & SKU */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {p.sku}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.category}
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {p.unit}
                        </td>

                        {/* Base Rate (Editable) */}
                        <td className="py-3.5 px-4 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-slate-400">₹</span>
                              <input 
                                type="number" 
                                autoFocus
                                value={editRate}
                                onChange={(e) => setEditRate(e.target.value)}
                                className="w-20 h-7 rounded border border-indigo-400 text-xs px-1.5 text-right font-bold text-slate-900"
                              />
                              <button
                                onClick={() => handleSaveRate(p)}
                                disabled={updatingId === p.id}
                                className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                                title="Save Rate"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700"
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : isQuoteOnRequest ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                              Rate on Request
                            </span>
                          ) : (
                            <span className="font-bold text-slate-900 text-sm">
                              ₹{p.baseRate.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* GST % */}
                        <td className="py-3.5 px-4 text-center text-slate-500 font-medium">
                          {p.gstPercent}%
                        </td>

                        {/* Stock Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleStock(p)}
                            disabled={updatingId === p.id}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                              p.inStock 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <span>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                          </button>
                        </td>

                        {/* Edit Price Action */}
                        <td className="py-3.5 px-4 text-right">
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(p.id);
                                setEditRate(String(p.baseRate));
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit Price</span>
                            </button>
                          )}
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

    </div>
  );
}
