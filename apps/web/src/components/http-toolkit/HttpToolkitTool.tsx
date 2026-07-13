'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ListChecks,
  FileSearch,
  Webhook,
  Search,
  Loader2,
  Copy,
  RefreshCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HTTP_STATUS_CODES } from '@/lib/http-status-codes';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORY_COLORS: Record<string, string> = {
  '1xx': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  '2xx': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  '3xx': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '4xx': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  '5xx': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface InspectResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  finalUrl: string;
  redirected: boolean;
  timingMs: number;
}

interface CapturedRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, unknown>;
  headers: Record<string, string>;
  body: string;
  bodyTruncated: boolean;
  receivedAt: string;
  ip: string;
}

export function HttpToolkitTool() {
  const [activeTab, setActiveTab] = useState('status-codes');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['status-codes', 'header-inspector', 'webhook-tester'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // --- STATUS CODE REFERENCE STATES ---
  const [statusSearch, setStatusSearch] = useState('');
  const [statusCategory, setStatusCategory] = useState<'all' | '1xx' | '2xx' | '3xx' | '4xx' | '5xx'>('all');

  const filteredCodes = useMemo(() => {
    const q = statusSearch.toLowerCase().trim();
    return HTTP_STATUS_CODES.filter((c) => {
      const matchesCategory = statusCategory === 'all' || c.category === statusCategory;
      const matchesSearch =
        !q ||
        String(c.code).includes(q) ||
        c.phrase.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [statusSearch, statusCategory]);

  // --- HEADER INSPECTOR STATES ---
  const [inspectUrl, setInspectUrl] = useState('https://example.com');
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  const handleInspect = async () => {
    if (!inspectUrl.trim()) return;
    setInspecting(true);
    setInspectError(null);
    setInspectResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/http-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inspectUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to inspect URL');
      }
      setInspectResult(data);
    } catch (e) {
      setInspectError((e as Error).message || 'Failed to inspect URL');
    } finally {
      setInspecting(false);
    }
  };

  // --- WEBHOOK TESTER STATES ---
  const [webhookId, setWebhookId] = useState<string | null>(null);
  const [webhookRequests, setWebhookRequests] = useState<CapturedRequest[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const captureUrl = webhookId ? `${API_BASE}/api/webhook/capture/${webhookId}` : null;

  const createWebhook = async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/webhook/create`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create webhook');
      setWebhookId(data.id);
      setWebhookRequests([]);
      toast.success('New webhook URL created');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create webhook');
    } finally {
      setWebhookLoading(false);
    }
  };

  const fetchWebhookRequests = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/webhook/${id}/requests`);
      if (!res.ok) return;
      const data = await res.json();
      setWebhookRequests(data.requests || []);
    } catch {
      // Silent — a transient poll failure isn't worth surfacing to the user.
    }
  };

  const clearWebhook = async () => {
    if (!webhookId) return;
    await fetch(`${API_BASE}/api/webhook/${webhookId}`, { method: 'DELETE' });
    setWebhookRequests([]);
    toast.success('Cleared captured requests');
  };

  useEffect(() => {
    if (activeTab !== 'webhook-tester' || !webhookId) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    fetchWebhookRequests(webhookId);
    pollRef.current = setInterval(() => fetchWebhookRequests(webhookId), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, webhookId]);

  const toggleExpanded = (id: string) => {
    setExpandedRequests((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-3 text-xs h-auto py-1">
        <TabsTrigger value="status-codes" className="gap-2">
          <ListChecks className="h-4 w-4" />
          Status Codes
        </TabsTrigger>
        <TabsTrigger value="header-inspector" className="gap-2">
          <FileSearch className="h-4 w-4" />
          Header Inspector
        </TabsTrigger>
        <TabsTrigger value="webhook-tester" className="gap-2">
          <Webhook className="h-4 w-4" />
          Webhook Tester
        </TabsTrigger>
      </TabsList>

      {/* --- STATUS CODE REFERENCE TAB --- */}
      <TabsContent value="status-codes" className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  placeholder="Search by code, phrase, or keyword..."
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <div className="flex gap-1.5">
                {(['all', '1xx', '2xx', '3xx', '4xx', '5xx'] as const).map((cat) => (
                  <Button
                    key={cat}
                    variant={statusCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusCategory(cat)}
                    className="h-8 text-xs px-2.5"
                  >
                    {cat === 'all' ? 'All' : cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {filteredCodes.map((c) => (
            <Card key={c.code} className="border">
              <CardContent className="p-3.5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">{c.code}</span>
                  <span className="font-semibold text-sm">{c.phrase}</span>
                  <Badge className={`ml-auto text-[10px] border-0 ${CATEGORY_COLORS[c.category]}`}>{c.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.description}</p>
              </CardContent>
            </Card>
          ))}
          {filteredCodes.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No status codes match your search.</p>
          )}
        </div>
      </TabsContent>

      {/* --- HEADER INSPECTOR TAB --- */}
      <TabsContent value="header-inspector" className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="inspect-url">URL to inspect</Label>
            <div className="flex gap-2">
              <Input
                id="inspect-url"
                value={inspectUrl}
                onChange={(e) => setInspectUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
                placeholder="https://example.com"
                className="font-mono text-xs"
              />
              <Button onClick={handleInspect} disabled={inspecting} className="gap-1.5 shrink-0">
                {inspecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
                Inspect
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Requests are fetched server-side (bypassing browser CORS). Requests to private/internal addresses are blocked.
            </p>
          </CardContent>
        </Card>

        {inspectError && (
          <div className="flex items-center gap-2 p-3 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {inspectError}
          </div>
        )}

        {inspectResult && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  className={`text-sm border-0 ${
                    inspectResult.status < 300
                      ? CATEGORY_COLORS['2xx']
                      : inspectResult.status < 400
                        ? CATEGORY_COLORS['3xx']
                        : inspectResult.status < 500
                          ? CATEGORY_COLORS['4xx']
                          : CATEGORY_COLORS['5xx']
                  }`}
                >
                  {inspectResult.status} {inspectResult.statusText}
                </Badge>
                <span className="text-xs text-muted-foreground">{inspectResult.timingMs}ms</span>
                {inspectResult.redirected && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Redirected to {inspectResult.finalUrl}
                  </span>
                )}
              </div>

              <div className="border rounded-md divide-y">
                {Object.entries(inspectResult.headers).map(([key, value]) => (
                  <div key={key} className="flex gap-2 p-2 text-xs font-mono">
                    <span className="font-bold text-primary shrink-0">{key}:</span>
                    <span className="text-muted-foreground break-all">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* --- WEBHOOK TESTER TAB --- */}
      <TabsContent value="webhook-tester" className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            {!webhookId ? (
              <Button onClick={createWebhook} disabled={webhookLoading} className="gap-1.5">
                {webhookLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                Generate a webhook URL
              </Button>
            ) : (
              <>
                <Label>Your capture URL — send requests here</Label>
                <div className="flex gap-2">
                  <Input value={captureUrl ?? ''} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(captureUrl ?? '', 'Capture URL copied')} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => webhookId && fetchWebhookRequests(webhookId)} className="gap-1.5 text-xs h-8">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Refresh now
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearWebhook} className="gap-1.5 text-xs h-8 text-red-500 hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear requests
                  </Button>
                  <Button variant="outline" size="sm" onClick={createWebhook} className="gap-1.5 text-xs h-8 ml-auto">
                    New URL
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Send any HTTP request (curl, a webhook provider, another app) to the URL above — it'll show up here within a few seconds. Expires after 1 hour of inactivity.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {webhookId && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Captured Requests ({webhookRequests.length})
              </h4>
              {webhookRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Waiting for a request... send one to your capture URL above.
                </p>
              ) : (
                <div className="border rounded-md divide-y max-h-[500px] overflow-y-auto">
                  {webhookRequests.map((req) => {
                    const isExpanded = expandedRequests.has(req.id);
                    return (
                      <div key={req.id}>
                        <button
                          onClick={() => toggleExpanded(req.id)}
                          className="w-full flex items-center gap-2 p-2.5 text-xs font-mono hover:bg-muted/30 text-left"
                        >
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                          <Badge variant="secondary" className="text-[10px]">{req.method}</Badge>
                          <span className="truncate">{req.path}</span>
                          <span className="ml-auto text-muted-foreground shrink-0">{new Date(req.receivedAt).toLocaleTimeString()}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-3 bg-muted/20 text-xs font-mono space-y-2 border-t">
                            <div>
                              <span className="font-bold">Headers</span>
                              <div className="pl-2 text-muted-foreground">
                                {Object.entries(req.headers).map(([k, v]) => (
                                  <div key={k} className="break-all">{k}: {v}</div>
                                ))}
                              </div>
                            </div>
                            {Object.keys(req.query).length > 0 && (
                              <div>
                                <span className="font-bold">Query</span>
                                <div className="pl-2 text-muted-foreground break-all">{JSON.stringify(req.query)}</div>
                              </div>
                            )}
                            <div>
                              <span className="font-bold">Body{req.bodyTruncated ? ' (truncated)' : ''}</span>
                              <div className="pl-2 text-muted-foreground break-all whitespace-pre-wrap">{req.body || '(empty)'}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
