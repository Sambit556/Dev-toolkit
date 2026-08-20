'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  RotateCw, 
  Trash2, 
  Plus, 
  Zap, 
  Clock, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  Inbox as InboxIcon, 
  ArrowRight,
  KeyRound,
  Eye,
  X,
  Code,
  FileText,
  Radio,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TempMessageSummary {
  id: string;
  from: string;
  to: string;
  subject: string;
  preview: string;
  createdAt: string;
  read: boolean;
  size?: number;
}

interface FullTempMessage extends TempMessageSummary {
  html: string;
  text: string;
  headers: Record<string, string>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface TempInboxProps {
  currentUserEmail?: string;
  currentUserName?: string;
}

export function TempInbox({ currentUserEmail, currentUserName }: TempInboxProps) {
  const [address, setAddress] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [messages, setMessages] = useState<TempMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<FullTempMessage | null>(null);
  const [isLoadingInbox, setIsLoadingInbox] = useState<boolean>(false);
  const [isLoadingMessage, setIsLoadingMessage] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [hasCopiedAddress, setHasCopiedAddress] = useState<boolean>(false);
  const [hasCopiedCode, setHasCopiedCode] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [customNameInput, setCustomNameInput] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [messageViewTab, setMessageViewTab] = useState<'html' | 'text' | 'headers'>('html');

  const storageKey = currentUserEmail 
    ? `devkits_temp_mail_${currentUserEmail.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    : 'devkits_temp_mail_guest';

  // Load or generate initial mailbox with user isolation
  const initMailbox = useCallback(async (customName?: string, forceNew = false) => {
    setIsLoadingInbox(true);
    try {
      const savedAddress = !customName && !forceNew ? localStorage.getItem(storageKey) : undefined;
      const res = await fetch(`${API_BASE}/api/tempmail/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customName: customName || (savedAddress ? savedAddress.split('@')[0] : undefined),
          ownerEmail: currentUserEmail,
          forceNew
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAddress(json.data.address);
        setExpiresAt(json.data.expiresAt);
        localStorage.setItem(storageKey, json.data.address);
        fetchMessages(json.data.address);
      }
    } catch {
      toast.error('Failed to initialize temporary mailbox');
    } finally {
      setIsLoadingInbox(false);
    }
  }, [currentUserEmail, storageKey]);

  // Fetch messages for active address
  const fetchMessages = useCallback(async (targetAddr?: string, silent = false) => {
    const addr = targetAddr || address;
    if (!addr) return;
    if (!silent) setIsLoadingInbox(true);
    try {
      const res = await fetch(`${API_BASE}/api/tempmail/inbox/${encodeURIComponent(addr)}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data.messages || []);
        if (json.data.expiresAt) setExpiresAt(json.data.expiresAt);
      }
    } catch {
      // silent background poll fail
    } finally {
      if (!silent) setIsLoadingInbox(false);
    }
  }, [address]);

  // Initial load
  useEffect(() => {
    initMailbox();
  }, [initMailbox]);

  // Auto-poll inbox every 3.5 seconds
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => {
      fetchMessages(address, true);
    }, 3500);
    return () => clearInterval(interval);
  }, [address, fetchMessages]);

  // Expiration countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const updateCountdown = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTime('Expired');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  // Extend expiration
  const handleExtend = async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_BASE}/api/tempmail/extend/${encodeURIComponent(address)}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setExpiresAt(json.data.expiresAt);
        toast.success('Mailbox validity extended by +60 minutes!');
      }
    } catch {
      toast.error('Failed to extend mailbox');
    }
  };

  // Copy address
  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setHasCopiedAddress(true);
    toast.success('Temporary email copied to clipboard!');
    setTimeout(() => setHasCopiedAddress(false), 2000);
  };

  // Open full message
  const handleOpenMessage = async (msgId: string) => {
    setIsLoadingMessage(true);
    try {
      const res = await fetch(`${API_BASE}/api/tempmail/message/${msgId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedMessage(json.data);
        // Mark as read in local list
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: true } : m));
      } else {
        toast.error(json.message || 'Message expired');
      }
    } catch {
      toast.error('Failed to load message details');
    } finally {
      setIsLoadingMessage(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/tempmail/message/${msgId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        toast.success('Message deleted');
        setMessages(prev => prev.filter(m => m.id !== msgId));
        if (selectedMessage?.id === msgId) {
          setSelectedMessage(null);
        }
      }
    } catch {
      toast.error('Failed to delete message');
    }
  };

  // Clear all messages
  const handleClearInbox = async () => {
    if (!address || messages.length === 0) return;
    try {
      const res = await fetch(`${API_BASE}/api/tempmail/inbox/${encodeURIComponent(address)}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessages([]);
        setSelectedMessage(null);
        toast.success('Inbox cleared');
      }
    } catch {
      toast.error('Failed to clear inbox');
    }
  };

  // Simulate an incoming email
  const handleSimulate = async (type: 'otp' | 'welcome' | 'alert' | 'invoice') => {
    if (!address) return;
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/tempmail/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, type }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Incoming ${type.toUpperCase()} email received!`);
        fetchMessages(address, true);
        handleOpenMessage(json.data.id);
      }
    } catch {
      toast.error('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  // Extract OTP or links from text for quick 1-click actions
  const extractedOtp = useMemo(() => {
    if (!selectedMessage) return null;
    const content = (selectedMessage.subject + ' ' + selectedMessage.text + ' ' + selectedMessage.html);
    const otpMatch = content.match(/\b\d{4,8}\b/);
    return otpMatch ? otpMatch[0] : null;
  }, [selectedMessage]);

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
      {/* Top Address Control Card */}
      <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shrink-0 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Email Address & Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] uppercase tracking-widest font-black text-slate-500">
                Active Disposable Email
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                <Clock className="h-3 w-3" /> {remainingTime || '60:00'}
              </span>
            </div>

            {/* Address Display Box */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 shadow-inner">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="select-all tracking-tight">{address || 'Generating address...'}</span>
              </div>

              {/* Copy Address Button */}
              <button
                onClick={handleCopyAddress}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm",
                  hasCopiedAddress
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                )}
              >
                {hasCopiedAddress ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {hasCopiedAddress ? 'Copied!' : 'Copy Address'}
              </button>

              {/* Extend Time */}
              <button
                onClick={handleExtend}
                title="Add 60 minutes validity"
                className="flex items-center gap-1 px-3 py-2 bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> +60m
              </button>

              {/* New Address / Custom */}
              <button
                onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Rename Subdomain
              </button>

              {/* Refresh */}
              <button
                onClick={() => fetchMessages(address)}
                title="Force refresh inbox"
                className="p-2 bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCw className={cn("h-4 w-4", isLoadingInbox && "animate-spin text-blue-500")} />
              </button>
            </div>
          </div>

          {/* Quick Simulation & Live Test Trigger Bar */}
          <div className="flex flex-col sm:items-end justify-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-500" /> Test Inbound Delivery:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => handleSimulate('otp')}
                disabled={isSimulating}
                className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                🔐 Receive OTP
              </button>
              <button
                onClick={() => handleSimulate('welcome')}
                disabled={isSimulating}
                className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                🚀 Receive Welcome
              </button>
              <button
                onClick={() => handleSimulate('alert')}
                disabled={isSimulating}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                ⚠️ Security Alert
              </button>
              <button
                onClick={() => handleSimulate('invoice')}
                disabled={isSimulating}
                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                💳 Receive Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Left Inbox List + Right Message Viewer */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Left: Message Feed List */}
        <div className="lg:w-[380px] xl:w-[420px] flex flex-col shrink-0 overflow-hidden bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          {/* Feed Header */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <InboxIcon className="h-4 w-4 text-blue-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Incoming Messages ({messages.length})
              </h3>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearInbox}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-500 cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear All
              </button>
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 animate-pulse">
                  <Radio className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Waiting for incoming emails...
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                    Send an email to <strong className="text-blue-500 font-mono">{address}</strong> or click any test simulation above.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleOpenMessage(msg.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer relative group",
                      isSelected
                        ? "bg-blue-50/90 dark:bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/20"
                        : msg.read
                        ? "bg-white/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300"
                        : "bg-white dark:bg-slate-950 border-blue-400/40 dark:border-blue-500/30 shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {!msg.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {msg.from}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">
                      {msg.subject || '(No Subject)'}
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {msg.preview}
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => handleDeleteMessage(msg.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1"
                        title="Delete email"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Reader Pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          {!selectedMessage ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Mail className="h-10 w-10 text-slate-400 dark:text-slate-600" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Select an email from the left to read
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Incoming emails render in an isolated, secure HTML viewer with extracted verification codes.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Message Header */}
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {selectedMessage.subject || '(No Subject)'}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>From: <strong className="text-slate-800 dark:text-slate-200">{selectedMessage.from}</strong></span>
                      <span>&middot;</span>
                      <span>To: <span className="font-mono text-slate-600 dark:text-slate-400">{selectedMessage.to}</span></span>
                      <span>&middot;</span>
                      <span className="font-mono">{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Tab Switcher: HTML / Plain Text / Headers */}
                    <div className="flex bg-slate-200/80 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => setMessageViewTab('html')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                          messageViewTab === 'html'
                            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => setMessageViewTab('text')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                          messageViewTab === 'text'
                            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => setMessageViewTab('headers')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                          messageViewTab === 'headers'
                            ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                      >
                        Headers
                      </button>
                    </div>

                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.id)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl cursor-pointer"
                      title="Delete email"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Auto-detected OTP or Security Code Banner */}
                {extractedOtp && (
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-blue-500" />
                      <span>Detected Verification Code:</span>
                      <span className="font-mono text-base font-black px-2 py-0.5 bg-blue-500/20 rounded-md tracking-wider">
                        {extractedOtp}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(extractedOtp);
                        setHasCopiedCode(extractedOtp);
                        toast.success(`Copied code: ${extractedOtp}`);
                        setTimeout(() => setHasCopiedCode(null), 2000);
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center gap-1"
                    >
                      {hasCopiedCode === extractedOtp ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {hasCopiedCode === extractedOtp ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>

              {/* Message Body Viewport */}
              <div className="flex-1 overflow-hidden pt-3">
                {messageViewTab === 'html' ? (
                  <div className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white overflow-hidden shadow-inner">
                    <iframe
                      title="Received Email HTML"
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <style>
                              html, body {
                                margin: 0;
                                padding: 16px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                word-break: break-word;
                              }
                              ::-webkit-scrollbar { width: 5px; height: 5px; }
                              ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 9999px; }
                            </style>
                          </head>
                          <body>
                            ${selectedMessage.html || `<pre>${selectedMessage.text}</pre>`}
                          </body>
                        </html>
                      `}
                      className="w-full h-full border-0 block"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : messageViewTab === 'text' ? (
                  <div className="w-full h-full overflow-auto bg-white dark:bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-800">
                    {selectedMessage.text || 'No plain text version available.'}
                  </div>
                ) : (
                  <div className="w-full h-full overflow-auto bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800 space-y-1">
                    {Object.entries(selectedMessage.headers || {}).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-blue-400 font-bold">{k}:</span>
                        <span className="text-slate-300 break-all">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Address Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" /> Custom Disposable Email
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose a custom alias for your disposable mailbox (letters, numbers, hyphens):
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs">
                <input
                  type="text"
                  placeholder="custom-alias"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                  className="bg-transparent border-0 outline-none flex-1 font-bold text-slate-900 dark:text-slate-100"
                />
                <span className="text-slate-400 font-semibold">@devkits.space</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!customNameInput.trim()) {
                    toast.error('Enter a custom alias name');
                    return;
                  }
                  initMailbox(customNameInput.trim());
                  setShowCustomModal(false);
                  setCustomNameInput('');
                  toast.success('Custom disposable mailbox activated!');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Activate Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
