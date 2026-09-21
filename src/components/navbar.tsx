"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layers, 
  Inbox, 
  PlusCircle, 
  Package, 
  Bell, 
  Search,
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'RFQ Inbox', href: '/', icon: Inbox },
    { label: 'Form Builder', href: '/forms/new', icon: PlusCircle },
    { label: 'Product Catalog', href: '/products', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tracking-tight text-slate-900 text-base">BusinessForms</span>
                  <Badge variant="purple" className="text-[10px] px-1.5 py-0 font-medium">B2B Pro</Badge>
                </div>
                <span className="text-[11px] text-slate-500 font-medium -mt-0.5">Arpit Solar & Electricals</span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions & User Info */}
          <div className="flex items-center gap-3">
            {/* Quick Status Pill */}
            <Link href="/products" className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100/70 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Catalog Active • 23 Items</span>
            </Link>

            {/* New Form CTA */}
            {pathname !== '/forms/new' && (
              <Link href="/forms/new">
                <Button size="sm" className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-100 rounded-lg h-9 px-3.5 font-medium text-xs">
                  <PlusCircle className="h-4 w-4" />
                  <span>Create Form</span>
                </Button>
              </Link>
            )}

            {/* Notifications */}
            <button 
              type="button"
              className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-600 ring-2 ring-white"></span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-xs font-semibold text-white shadow-sm ring-2 ring-white">
                RM
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-none">Ratnesh M.</span>
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5">Admin</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
