'use client';

import React, { useState, useMemo } from 'react';
import { 
  EMAIL_TEMPLATES, 
  EMAIL_CATEGORIES, 
  EmailTemplate 
} from './templates';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  Smartphone, 
  Monitor, 
  Code, 
  Search, 
  SlidersHorizontal,
  X,
  ArrowRight,
  Zap,
  Lock,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmailTemplateGalleryProps {
  onUseTemplate: (subject: string, html: string) => void;
  currentUserEmail?: string;
  onQuickTestSend?: (to: string, subject: string, html: string) => Promise<boolean>;
}

export function EmailTemplateGallery({ 
  onUseTemplate, 
  currentUserEmail,
  onQuickTestSend 
}: EmailTemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [customVars, setCustomVars] = useState<Record<string, string>>({ ...EMAIL_TEMPLATES[0].variables });
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile' | 'code'>('desktop');
  const [hasCopied, setHasCopied] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return EMAIL_TEMPLATES.filter((tmpl) => {
      const matchCat = selectedCategory === 'all' || tmpl.category === selectedCategory;
      const matchSearch = 
        !searchQuery.trim() || 
        tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tmpl.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Handle selecting a template to preview/customize
  const handleSelectTemplate = (tmpl: EmailTemplate) => {
    setActiveTemplate(tmpl);
    setCustomVars({ ...tmpl.variables });
  };

  // Compile raw production HTML for copying / sending
  const compiledHtml = useMemo(() => {
    return activeTemplate.generateHtml(customVars);
  }, [activeTemplate, customVars]);

  // Compile preview HTML with injected clean scrollbars and zero-margin resets
  const previewHtml = useMemo(() => {
    const raw = activeTemplate.generateHtml(customVars);
    const injectedStyles = `
      <style>
        * { box-sizing: border-box !important; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow-x: hidden !important;
          -webkit-font-smoothing: antialiased !important;
        }
        table {
          max-width: 100% !important;
        }
        /* Custom sleek ultra-thin scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.25);
          border-radius: 9999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      </style>
    `;
    if (raw.includes('<head>')) {
      return raw.replace('<head>', `<head>${injectedStyles}`);
    }
    return injectedStyles + raw;
  }, [activeTemplate, customVars]);

  // Compile active subject line
  const compiledSubject = useMemo(() => {
    let sub = activeTemplate.defaultSubject;
    Object.entries(customVars).forEach(([k, v]) => {
      sub = sub.replace(new RegExp(`{{${k}}}`, 'g'), v);
    });
    return sub;
  }, [activeTemplate, customVars]);

  // Copy HTML to clipboard
  const handleCopyHtml = () => {
    navigator.clipboard.writeText(compiledHtml);
    setHasCopied(true);
    toast.success('HTML template copied to clipboard!');
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Inject into single send composer
  const handleApplyToComposer = () => {
    onUseTemplate(compiledSubject, compiledHtml);
    toast.success(`"${activeTemplate.name}" loaded into Compose tab!`);
  };

  // Quick test send to current user
  const handleTestSend = async () => {
    if (!currentUserEmail) {
      toast.error('Enter an email in composer to send test');
      return;
    }
    if (!onQuickTestSend) {
      handleApplyToComposer();
      return;
    }
    setIsSendingTest(true);
    try {
      const ok = await onQuickTestSend(currentUserEmail, compiledSubject, compiledHtml);
      if (ok) {
        toast.success(`Test email dispatched to ${currentUserEmail}!`);
      }
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden h-full">
      {/* Left Column: Template Catalog & Filter */}
      <div className="lg:w-[360px] xl:w-[400px] flex flex-col shrink-0 overflow-hidden bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Template Gallery
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
            {EMAIL_TEMPLATES.length} Ready
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative my-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search templates (OTP, Welcome, Invoice)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
          {EMAIL_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer",
                selectedCategory === cat.key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30 scale-[1.02]"
                  : "bg-slate-200/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Card List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No templates found matching your search.
            </div>
          ) : (
            filteredTemplates.map((tmpl) => {
              const isActive = activeTemplate.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all cursor-pointer relative group",
                    isActive
                      ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-500/60 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                      : "bg-white dark:bg-slate-950/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span 
                        className="h-2 w-2 rounded-full shrink-0" 
                        style={{ backgroundColor: tmpl.color }}
                      />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {tmpl.name}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500">
                      {tmpl.category}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                    {tmpl.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {Object.keys(tmpl.variables).length} dynamic vars
                    </span>
                    <span className={cn(
                      "flex items-center gap-1 font-bold transition-colors",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    )}>
                      {isActive ? 'Active Preview' : 'Select Preview'} <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Live Interactive Preview & Customizer */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {activeTemplate.name}
              </span>
              <span 
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border text-white"
                style={{ backgroundColor: activeTemplate.color, borderColor: activeTemplate.color }}
              >
                Live Preview
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate max-w-md mt-0.5">
              Subject: <span className="text-slate-700 dark:text-slate-300 font-semibold">{compiledSubject}</span>
            </div>
          </div>

          {/* Action Buttons & Device Switcher */}
          <div className="flex items-center gap-2">
            {/* Device Toggles */}
            <div className="flex bg-slate-200/80 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop View (600px)"
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs",
                  previewDevice === 'desktop' 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile View (375px)"
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs",
                  previewDevice === 'mobile' 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('code')}
                title="HTML Source Code"
                className={cn(
                  "p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs",
                  previewDevice === 'code' 
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <Code className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Copy HTML */}
            <button
              onClick={handleCopyHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              {hasCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {hasCopied ? 'Copied' : 'Copy HTML'}
            </button>

            {/* Test Send */}
            {currentUserEmail && (
              <button
                onClick={handleTestSend}
                disabled={isSendingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Zap className="h-3.5 w-3.5" />
                {isSendingTest ? 'Sending...' : 'Test Send'}
              </button>
            )}

            {/* Use Template */}
            <button
              onClick={handleApplyToComposer}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20"
            >
              <Send className="h-3.5 w-3.5" /> Use in Composer
            </button>
          </div>
        </div>

        {/* Main Preview Frame & Live Variable Sidebar */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden pt-3">
          {/* Live Variable Editor Drawer */}
          <div className="md:w-56 lg:w-64 flex flex-col shrink-0 overflow-y-auto bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 text-blue-500" /> Dynamic Variables
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Change variable values below to see real-time updates in the live preview.
            </p>

            <div className="space-y-2.5 pt-1">
              {Object.entries(customVars).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[9px] font-mono uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
                    {`{{${key}}}`}
                  </label>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setCustomVars({ ...customVars, [key]: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => setCustomVars({ ...activeTemplate.variables })}
              className="w-full mt-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
            >
              Reset to Template Defaults
            </button>
          </div>

          {/* Device Preview Viewport */}
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-slate-950/90 dark:bg-slate-950/95 rounded-2xl border border-slate-800/80 p-3 sm:p-5 relative">
            {previewDevice === 'code' ? (
              <div className="w-full h-full overflow-auto bg-[#070b14] p-4 rounded-xl font-mono text-[11px] text-slate-300 selection:bg-blue-900 selection:text-white leading-relaxed border border-slate-800">
                <pre>{compiledHtml}</pre>
              </div>
            ) : previewDevice === 'mobile' ? (
              /* High-End Mobile Hardware Mockup */
              <div className="w-[360px] max-w-full h-full max-h-[660px] flex flex-col bg-slate-900 border-[7px] border-slate-800 rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden shrink-0 relative">
                {/* Dynamic Island / Notch */}
                <div className="h-6 bg-slate-900 flex items-center justify-center shrink-0 border-b border-slate-800/50">
                  <div className="w-20 h-3 bg-black rounded-full flex items-center justify-end px-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500/40" />
                  </div>
                </div>

                {/* Mobile Viewport Screen */}
                <div className="flex-1 overflow-hidden bg-white relative">
                  <iframe
                    key={activeTemplate.id + '-' + JSON.stringify(customVars)}
                    title="Live Mobile Email Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full border-0 block"
                    sandbox="allow-same-origin"
                  />
                </div>

                {/* Mobile Home Bar */}
                <div className="h-4 bg-slate-900 flex items-center justify-center shrink-0">
                  <div className="w-24 h-1 bg-slate-700 rounded-full" />
                </div>
              </div>
            ) : (
              /* High-End Desktop Browser Mockup */
              <div className="w-full max-w-[640px] h-full flex flex-col bg-slate-900/90 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden shrink-0">
                {/* Mac-style Window Titlebar */}
                <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="bg-slate-950 px-3 py-0.5 rounded-md border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5 max-w-xs truncate">
                      <Lock className="h-2.5 w-2.5 text-emerald-400" />
                      <span className="truncate">devkits.space/email-preview</span>
                    </div>
                  </div>
                </div>

                {/* Desktop Viewport Screen */}
                <div className="flex-1 overflow-hidden bg-white relative">
                  <iframe
                    key={activeTemplate.id + '-' + JSON.stringify(customVars)}
                    title="Live Desktop Email Preview"
                    srcDoc={previewHtml}
                    className="w-full h-full border-0 block"
                    sandbox="allow-same-origin"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
