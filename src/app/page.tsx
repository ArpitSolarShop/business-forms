import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  PlusCircle, 
  FileText, 
  ClipboardList, 
  TrendingUp, 
  Search, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Package,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ShoppingBag
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const forms = await prisma.form.findMany({
    include: {
      organization: true,
      _count: {
        select: { responses: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const responses = await prisma.formResponse.findMany({
    include: {
      form: true,
      answers: {
        include: {
          field: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 15
  });

  const products = await prisma.product.findMany({
    take: 4,
    orderBy: { baseRate: 'desc' }
  });

  const stats = {
    totalForms: forms.length,
    newRfqs: responses.filter(r => r.status === 'New').length,
    pendingQuotes: responses.filter(r => r.status === 'Quoted').length,
    approved: responses.filter(r => r.status === 'Approved').length,
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Hero / Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-7 sm:p-8 shadow-md">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>Enterprise B2B Workflow System</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Commercial Operations & RFQ Inbox
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Receive wholesale inquiries, generate automated GST-compliant quotations, and manage purchase requests from your custom business forms.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/forms/new">
                <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-100 shadow-sm font-semibold rounded-xl h-11 px-5 text-sm">
                  <PlusCircle className="mr-2 h-4 w-4 text-indigo-600" />
                  Create Business Form
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard KPI Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* New RFQs */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Inquiries</span>
              <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ClipboardList className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{stats.newRfqs}</span>
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Requires Quote</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Unanswered wholesale requests</p>
          </div>

          {/* Pending Quotes */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Quotes</span>
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{stats.pendingQuotes}</span>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Proforma Issued</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Awaiting customer approval</p>
          </div>

          {/* Approved Orders */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Orders</span>
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{stats.approved}</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Confirmed PO</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Ready for dispatch & billing</p>
          </div>

          {/* Active Forms */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Forms</span>
              <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{stats.totalForms}</span>
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Live Public</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Published capture channels</p>
          </div>

        </div>

        {/* Main Workspace: 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Main Section: RFQ Inbox (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Incoming Requests & RFQs</h2>
                <p className="text-xs text-slate-500">Live submissions received from wholesale inquiry forms</p>
              </div>
              <Badge variant="outline" className="bg-white font-medium text-slate-600">
                {responses.length} Submissions
              </Badge>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
              {/* Search & Filter Header */}
              <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                <input 
                  type="text" 
                  placeholder="Filter by RFQ #, customer phone, vendor name..." 
                  className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-800 placeholder:text-slate-400 focus:ring-0"
                />
              </div>

              {/* Response List */}
              <div className="divide-y divide-slate-100">
                {responses.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800">No Inquiries Received Yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Share your form link with dealers or clients to start receiving product requests and quotation inquiries.
                    </p>
                    {forms.length > 0 && (
                      <Link href={`/f/${forms[0].id}`} target="_blank" className="inline-flex mt-4">
                        <Button variant="outline" size="sm" className="rounded-lg text-xs">
                          Test Submit Form <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  responses.map((response) => {
                    // Check if response contains cart items
                    const productAnswer = response.answers.find(a => a.field.type === 'PRODUCT_TABLE');
                    let itemCount = 0;
                    if (productAnswer) {
                      try {
                        const parsedCart = JSON.parse(productAnswer.value);
                        itemCount = Object.keys(parsedCart).length;
                      } catch(e) {}
                    }

                    return (
                      <Link 
                        href={`/responses/${response.id}`} 
                        key={response.id} 
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-5 hover:bg-slate-50/90 transition-all gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          {/* Indicator Dot & Icon */}
                          <div className={`mt-0.5 sm:mt-0 h-9 w-9 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                            response.status === 'New' 
                              ? 'bg-amber-100/80 text-amber-800' 
                              : response.status === 'Quoted' 
                              ? 'bg-blue-100/80 text-blue-800' 
                              : 'bg-emerald-100/80 text-emerald-800'
                          }`}>
                            {response.status === 'New' ? '!' : response.status === 'Quoted' ? '₹' : '✓'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {response.rfqNumber}
                              </span>
                              {itemCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <ShoppingBag className="h-3 w-3 text-slate-400" />
                                  {itemCount} {itemCount === 1 ? 'Product' : 'Products'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              <span className="font-medium text-slate-700">{response.respondent || 'Direct Buyer'}</span>
                              <span className="mx-1.5 text-slate-300">•</span>
                              <span>{response.form.title}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status & Date & Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-12 sm:pl-0">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            response.status === 'New' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/80' 
                              : response.status === 'Quoted' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/80' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              response.status === 'New' ? 'bg-amber-500' : response.status === 'Quoted' ? 'bg-blue-500' : 'bg-emerald-500'
                            }`} />
                            {response.status}
                          </span>

                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(response.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>

                          <div className="hidden sm:flex h-7 w-7 rounded-md items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar: Forms & Catalog Quick Access (1 Col) */}
          <div className="space-y-6">
            
            {/* Forms section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Your Forms</h3>
                <Link href="/forms/new" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>New</span>
                </Link>
              </div>

              <div className="space-y-2.5">
                {forms.map((form) => (
                  <div 
                    key={form.id} 
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-slate-800 truncate">{form.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">
                            {form._count.responses} {form._count.responses === 1 ? 'response' : 'responses'}
                          </span>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-xs text-indigo-600 font-medium truncate">
                            {form.organization.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <Link 
                        href={`/f/${form.id}`} 
                        target="_blank" 
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open Public Link</span>
                      </Link>

                      <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 py-0">
                        Published
                      </Badge>
                    </div>
                  </div>
                ))}

                {forms.length === 0 && (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl bg-white text-slate-400 text-xs">
                    No forms created yet. Click above to create one.
                  </div>
                )}
              </div>
            </div>

            {/* Catalog Master Snapshot */}
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">B2B Product Catalog</h3>
                </div>
                <Badge variant="secondary" className="text-[10px]">Active</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Products automatically loaded into your form&apos;s quotation tables:
              </p>

              <div className="space-y-2 pt-1">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-slate-900">
                        {p.baseRate > 1 ? `₹${p.baseRate.toLocaleString()}` : 'Rate on Request'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">GST {p.gstPercent}%</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link 
                  href="/products" 
                  className="w-full py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Manage Complete Catalog (23 Items)</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              </div>
            </div>

            {/* System Trust Card */}
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/50 to-purple-50/40 p-4 text-xs space-y-2 text-slate-600">
              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>GST & Quotation Compliant</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Responses calculate HSN/GST totals automatically and generate client-ready proforma invoices ready for 1-click printing.
              </p>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
