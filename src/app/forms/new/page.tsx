"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  ArrowLeft, 
  Sparkles,
  Layers, 
  Building2, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingBag,
  HelpCircle,
  Copy,
  SlidersHorizontal,
  FileCheck
} from 'lucide-react';

type Field = {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
};

export default function FormBuilder() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [orgName, setOrgName] = useState('Arpit Solar & Electricals');
  
  const [fields, setFields] = useState<Field[]>([
    { 
      id: '1', 
      type: 'PRODUCT_TABLE', 
      label: 'Select Required Solar Equipment & Quantities', 
      placeholder: 'Choose from our wholesale catalogue', 
      required: true 
    },
    { 
      id: '2', 
      type: 'TEXT', 
      label: 'GST Number (Optional for B2B Invoice)', 
      placeholder: 'e.g. 07AAAAA0000A1Z5', 
      required: false 
    },
    { 
      id: '3', 
      type: 'PARAGRAPH', 
      label: 'Site Address or Delivery Location', 
      placeholder: 'Complete address with pincode', 
      required: true 
    }
  ]);

  const [activeFieldId, setActiveFieldId] = useState<string | null>('1');

  const [settings, setSettings] = useState({
    requireDomain: false,
    allowedDomain: '',
    expirationDate: '',
  });

  const addField = (defaultType = 'TEXT', defaultLabel = 'New Question') => {
    const newId = Math.random().toString();
    setFields([...fields, { 
      id: newId, 
      type: defaultType, 
      label: defaultLabel, 
      placeholder: '', 
      required: false 
    }]);
    setActiveFieldId(newId);
  };

  const removeField = (id: string) => {
    if (fields.length === 1) {
      alert("At least one field is required.");
      return;
    }
    setFields(fields.filter(f => f.id !== id));
    if (activeFieldId === id) {
      setActiveFieldId(null);
    }
  };

  const duplicateField = (field: Field) => {
    const newId = Math.random().toString();
    const cloned = { ...field, id: newId, label: `${field.label} (Copy)` };
    const index = fields.findIndex(f => f.id === field.id);
    const updated = [...fields];
    updated.splice(index + 1, 0, cloned);
    setFields(updated);
    setActiveFieldId(newId);
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const saveForm = async () => {
    if (!title.trim()) {
      alert("Please provide a Title for your form.");
      return;
    }
    if (!orgName.trim()) {
      alert("Organization name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          organizationName: orgName,
          fields,
          settings: JSON.stringify(settings)
        })
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save form");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans flex flex-col pb-24">
      
      {/* Top Builder App Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="h-9 w-9 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Builder</span>
                <span className="text-slate-300">•</span>
                <Badge variant="outline" className="text-[10px] py-0 bg-slate-50 text-slate-600 font-medium">
                  Interactive Mode
                </Badge>
              </div>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Name your form (e.g. Solar Equipment RFQ Form)..." 
                className="font-bold text-slate-900 text-base sm:text-lg bg-transparent border-none outline-none placeholder:text-slate-400 hover:bg-slate-50/80 rounded px-1 -ml-1 transition-colors w-72 sm:w-96 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 text-xs">
                Discard
              </Button>
            </Link>

            <Button 
              onClick={saveForm} 
              disabled={isSubmitting} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 rounded-xl px-4 py-2 font-medium text-xs h-9"
            >
              {isSubmitting ? (
                <>
                  <Save className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <FileCheck className="mr-1.5 h-3.5 w-3.5" /> Publish Form
                </>
              )}
            </Button>
          </div>

        </div>
      </header>

      {/* Main Canvas with Segmented Tabs */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 mt-6 space-y-6">
        
        <Tabs defaultValue="questions" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="bg-slate-200/70 p-1 rounded-xl shadow-xs">
              <TabsTrigger 
                value="questions" 
                className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
              >
                Form Questions & Catalog
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs"
              >
                Access & Workflow Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: FORM QUESTIONS */}
          <TabsContent value="questions" className="space-y-5 focus-visible:outline-none">
            
            {/* Organization Identity Box */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                <div className="sm:col-span-1 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Issuer Organization</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Will appear on generated quotations and form letterhead.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <Input 
                    value={orgName} 
                    onChange={(e) => setOrgName(e.target.value)} 
                    placeholder="e.g. Arpit Solar & Electricals" 
                    className="border-slate-200 font-medium text-slate-900 focus-visible:ring-indigo-500 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Form Title & Intro Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Form Public Title</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Wholesale Equipment Inquiry & RFQ Form" 
                  className="text-xl font-bold border-slate-200 text-slate-900 rounded-xl h-11 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1 pt-1">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description & Buyer Instructions</Label>
                <textarea 
                  rows={2}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Specify instructions for your dealers or buyers (e.g. Select your desired quantities below. Our sales desk will issue an official quotation with dispatch timeline within 2 hours)." 
                  className="w-full text-sm border border-slate-200 rounded-xl p-3 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {fields.map((field, index) => {
                const isActive = activeFieldId === field.id;

                return (
                  <div 
                    key={field.id}
                    onClick={() => setActiveFieldId(field.id)}
                    className={`rounded-2xl bg-white transition-all border ${
                      isActive 
                        ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-md' 
                        : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="p-5 sm:p-6 space-y-5">
                      
                      {/* Card Header row with field number and type badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Field #{index + 1}
                          </span>
                          {field.type === 'PRODUCT_TABLE' && (
                            <Badge variant="purple" className="text-[11px] gap-1 py-0.5">
                              <ShoppingBag className="h-3 w-3" />
                              Commercial Catalog (RFQ)
                            </Badge>
                          )}
                        </div>

                        {/* Field Type Selector */}
                        <div className="w-52">
                          <Select 
                            value={field.type} 
                            onValueChange={(val) => updateField(field.id, { type: val as string })}
                          >
                            <SelectTrigger className="h-8 text-xs font-medium bg-slate-50 border-slate-200 rounded-lg">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRODUCT_TABLE" className="font-semibold text-indigo-600">
                                🛒 Product Catalog (RFQ)
                              </SelectItem>
                              <SelectItem value="TEXT">Short Answer</SelectItem>
                              <SelectItem value="PARAGRAPH">Paragraph / Address</SelectItem>
                              <SelectItem value="RADIO">Multiple Choice</SelectItem>
                              <SelectItem value="CHECKBOX">Checkboxes</SelectItem>
                              <SelectItem value="DATE">Date Picker</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Question Label and Placeholder Inputs */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-600">Question Prompt / Field Label</Label>
                          <Input 
                            value={field.label} 
                            onChange={(e) => updateField(field.id, { label: e.target.value })} 
                            placeholder="e.g. Select Required Items"
                            className="font-semibold text-slate-900 text-sm sm:text-base border-slate-200 rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-400">Helper text or placeholder</Label>
                          <Input 
                            value={field.placeholder} 
                            onChange={(e) => updateField(field.id, { placeholder: e.target.value })} 
                            placeholder="Optional instructions for the respondent..."
                            className="text-xs text-slate-600 border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Specialized Callout if it's the Product Table */}
                      {field.type === 'PRODUCT_TABLE' && (
                        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
                          <ShoppingBag className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold text-indigo-900">Live B2B Pricing Engine Linked</p>
                            <p className="text-indigo-700/90 text-[11px] leading-relaxed">
                              This field renders an interactive wholesale catalog with live quantity steppers, instant subtotal calculations, and automatic HSN/GST estimation.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Active Card Footer Actions */}
                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); duplicateField(field); }}
                            className="text-slate-500 hover:text-slate-800 text-xs h-8 px-2"
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                            className="text-slate-400 hover:text-red-600 text-xs h-8 px-2"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Label htmlFor={`req-${field.id}`} className="text-xs font-medium text-slate-600 cursor-pointer">
                            Required Field
                          </Label>
                          <Switch 
                            id={`req-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(c) => updateField(field.id, { required: c })}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <Button 
                onClick={() => addField('TEXT', 'New Text Question')} 
                variant="outline" 
                size="sm" 
                className="rounded-xl bg-white border-slate-200/90 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Short Text
              </Button>
              <Button 
                onClick={() => addField('PARAGRAPH', 'Detailed Notes / Requirements')} 
                variant="outline" 
                size="sm" 
                className="rounded-xl bg-white border-slate-200/90 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Paragraph
              </Button>
              <Button 
                onClick={() => addField('PRODUCT_TABLE', 'Equipment Order / RFQ')} 
                variant="outline" 
                size="sm" 
                className="rounded-xl bg-indigo-50 border-indigo-200 text-xs text-indigo-700 hover:bg-indigo-100 font-medium"
              >
                <Plus className="h-3.5 w-3.5 mr-1 text-indigo-600" /> Add Product Table
              </Button>
            </div>

          </TabsContent>

          {/* TAB 2: ACCESS & SETTINGS */}
          <TabsContent value="settings" className="space-y-4 focus-visible:outline-none">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Form Access & Restrictions</h3>
                <p className="text-xs text-slate-500 mt-1">Control who can access this inquiry portal and set validity windows.</p>
              </div>

              <div className="space-y-4 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5 max-w-md">
                    <Label className="text-sm font-semibold text-slate-800">Email Domain Restriction</Label>
                    <p className="text-xs text-slate-500">Only authorized corporate dealers from specific email domains can submit.</p>
                  </div>
                  <Switch 
                    checked={settings.requireDomain} 
                    onCheckedChange={(c) => setSettings({ ...settings, requireDomain: c })} 
                  />
                </div>

                {settings.requireDomain && (
                  <div className="pt-4 pl-2 space-y-2">
                    <Label className="text-xs font-semibold text-slate-700">Permitted Domain Name</Label>
                    <Input 
                      value={settings.allowedDomain}
                      onChange={(e) => setSettings({ ...settings, allowedDomain: e.target.value })}
                      placeholder="e.g. solardealer.com" 
                      className="max-w-sm rounded-xl text-xs"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4">
                  <div className="space-y-0.5 max-w-md">
                    <Label className="text-sm font-semibold text-slate-800">Expiration & Closing Date</Label>
                    <p className="text-xs text-slate-500">Automatically deactivate the form once the promotion or tender period ends.</p>
                  </div>
                  <Input 
                    type="date" 
                    value={settings.expirationDate}
                    onChange={(e) => setSettings({ ...settings, expirationDate: e.target.value })}
                    className="w-44 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

      </main>

    </div>
  );
}
