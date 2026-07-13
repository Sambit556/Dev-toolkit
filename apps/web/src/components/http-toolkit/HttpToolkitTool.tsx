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
  GitCompare,
  Shield,
  Clock,
  Send,
  Terminal,
  Braces,
  Settings2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HTTP_STATUS_CODES } from '@/lib/http-status-codes';
import { gradeSecurityHeaders, type SecurityGradeResult } from '@/lib/security-headers';
import { buildCurlCommand, tryPrettyJson } from '@/lib/http-toolkit-utils';
import { KeyValueEditor, type KeyValuePair } from './KeyValueEditor';
import { toast } from 'sonner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORY_COLORS: Record<string, string> = {
  '1xx': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  '2xx': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  '3xx': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  '4xx': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  '5xx': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const GRADE_COLORS: Record<SecurityGradeResult['grade'], string> = {
  A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  F: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const METHOD_BADGE_COLORS: Record<string, string> = {
  GET: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PATCH: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const METHOD_BORDER_COLORS: Record<string, string> = {
  GET: 'border-l-sky-500',
  POST: 'border-l-emerald-500',
  PUT: 'border-l-amber-500',
  PATCH: 'border-l-violet-500',
  DELETE: 'border-l-red-500',
};
function methodBadgeClass(method: string): string {
  return METHOD_BADGE_COLORS[method.toUpperCase()] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400';
}
function methodBorderClass(method: string): string {
  return METHOD_BORDER_COLORS[method.toUpperCase()] ?? 'border-l-slate-400';
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  return `${Math.floor(min / 60)}h ago`;
}

interface InspectResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  finalUrl: string;
  redirected: boolean;
  body?: string;
  bodyTruncated?: boolean;
  timingMs: number;
  dnsMs: number;
  connectAndWaitMs: number;
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

interface ReplayState {
  open: boolean;
  reqId: string | null;
  targetUrl: string;
  allowPrivate: boolean;
  loading: boolean;
  result: InspectResult | null;
  error: string | null;
}

function statusBadgeClass(status: number): string {
  if (status < 300) return CATEGORY_COLORS['2xx'];
  if (status < 400) return CATEGORY_COLORS['3xx'];
  if (status < 500) return CATEGORY_COLORS['4xx'];
  return CATEGORY_COLORS['5xx'];
}

function InspectResultCard({ result, label }: { result: InspectResult; label?: string }) {
  const [showBody, setShowBody] = useState(false);
  const grade = useMemo(() => gradeSecurityHeaders(result.headers), [result.headers]);
  const pretty = result.body ? tryPrettyJson(result.body) : null;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {label && <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={`text-sm border-0 ${statusBadgeClass(result.status)}`}>
            {result.status} {result.statusText}
          </Badge>
          <Badge className={`text-xs border-0 gap-1 ${GRADE_COLORS[grade.grade]}`}>
            <Shield className="h-3 w-3" />
            Grade {grade.grade}
          </Badge>
          {result.redirected && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Redirected to {result.finalUrl}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            DNS {result.dnsMs}ms
          </span>
          <span>Connect + wait {result.connectAndWaitMs}ms</span>
          <span className="font-semibold text-foreground">Total {result.timingMs}ms</span>
        </div>

        <div className="border rounded-md divide-y">
          {Object.entries(result.headers).map(([key, value]) => (
            <div key={key} className="flex gap-2 p-2 text-xs font-mono">
              <span className="font-bold text-primary shrink-0">{key}:</span>
              <span className="text-muted-foreground break-all">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Security headers</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {grade.findings.map((f) => (
              <div key={f.header} className="flex items-start gap-1.5 text-[11px]">
                <span
                  className={`mt-0.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                    f.status === 'good' ? 'bg-green-500' : f.status === 'weak' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                />
                <span>
                  <span className="font-semibold">{f.header}</span>{' '}
                  <span className="text-muted-foreground">{f.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {result.body !== undefined && (
          <div>
            <button
              onClick={() => setShowBody((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {showBody ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Response body{result.bodyTruncated ? ' (truncated)' : ''}
            </button>
            {showBody && (
              <pre className="mt-2 p-2.5 bg-muted/30 border rounded-md text-[11px] font-mono whitespace-pre-wrap break-all max-h-72 overflow-y-auto">
                {pretty ?? result.body ?? '(empty)'}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HeaderDiffTable({ a, b }: { a: InspectResult | null; b: InspectResult | null }) {
  const keys = useMemo(() => {
    const set = new Set<string>();
    Object.keys(a?.headers ?? {}).forEach((k) => set.add(k));
    Object.keys(b?.headers ?? {}).forEach((k) => set.add(k));
    return Array.from(set).sort();
  }, [a, b]);

  if (!a && !b) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Header diff</p>
        <div className="border rounded-md divide-y text-xs font-mono overflow-x-auto">
          {keys.map((key) => {
            const va = a?.headers[key];
            const vb = b?.headers[key];
            const differs = va !== vb;
            return (
              <div key={key} className={`grid grid-cols-[minmax(120px,1fr)_1fr_1fr] gap-2 p-2 ${differs ? 'bg-amber-500/10' : ''}`}>
                <span className="font-bold text-primary break-all">{key}</span>
                <span className={`break-all ${va === undefined ? 'text-muted-foreground italic' : ''}`}>{va ?? '(absent)'}</span>
                <span className={`break-all ${vb === undefined ? 'text-muted-foreground italic' : ''}`}>{vb ?? '(absent)'}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
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
  const [inspectUrl, setInspectUrl] = useState('');
  const [inspectUrlB, setInspectUrlB] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [inspectMethod, setInspectMethod] = useState<'GET' | 'HEAD' | 'POST'>('GET');
  const [inspectBody, setInspectBody] = useState('');
  const [customHeaders, setCustomHeaders] = useState<KeyValuePair[]>([]);
  const [followRedirects, setFollowRedirects] = useState(true);
  const [allowPrivate, setAllowPrivate] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [inspectResultB, setInspectResultB] = useState<InspectResult | null>(null);
  const [inspectErrorB, setInspectErrorB] = useState<string | null>(null);

  const runInspect = async (url: string): Promise<{ ok: true; data: InspectResult } | { ok: false; error: string }> => {
    try {
      const headersObj = Object.fromEntries(
        customHeaders.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]),
      );
      const res = await fetch(`${API_BASE}/api/http-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          method: inspectMethod,
          headers: Object.keys(headersObj).length ? headersObj : undefined,
          followRedirects,
          allowPrivate,
          body: inspectMethod === 'POST' && inspectBody ? inspectBody : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to inspect URL');
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: (e as Error).message || 'Failed to inspect URL' };
    }
  };

  const handleInspect = async () => {
    if (!inspectUrl.trim()) return;
    setInspecting(true);
    setInspectError(null);
    setInspectResult(null);
    const r = await runInspect(inspectUrl);
    if (r.ok) setInspectResult(r.data);
    else setInspectError(r.error);
    setInspecting(false);
  };

  const handleCompare = async () => {
    if (!inspectUrl.trim() || !inspectUrlB.trim()) return;
    setInspecting(true);
    setInspectError(null);
    setInspectErrorB(null);
    setInspectResult(null);
    setInspectResultB(null);
    const [ra, rb] = await Promise.all([runInspect(inspectUrl), runInspect(inspectUrlB)]);
    if (ra.ok) setInspectResult(ra.data);
    else setInspectError(ra.error);
    if (rb.ok) setInspectResultB(rb.data);
    else setInspectErrorB(rb.error);
    setInspecting(false);
  };

  // --- WEBHOOK TESTER STATES ---
  const [webhookId, setWebhookId] = useState<string | null>(null);
  const [webhookRequests, setWebhookRequests] = useState<CapturedRequest[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookRefreshing, setWebhookRefreshing] = useState(false);
  const [webhookSearch, setWebhookSearch] = useState('');
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mockDialogOpen, setMockDialogOpen] = useState(false);
  const [savingMock, setSavingMock] = useState(false);
  const [mockStatus, setMockStatus] = useState(200);
  const [mockHeaders, setMockHeaders] = useState<KeyValuePair[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [mockBody, setMockBody] = useState('{"ok":true}');

  const [replayState, setReplayState] = useState<ReplayState>({
    open: false,
    reqId: null,
    targetUrl: '',
    allowPrivate: false,
    loading: false,
    result: null,
    error: null,
  });

  const [testMethod, setTestMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('POST');
  const [testPath, setTestPath] = useState('');
  const [testHeaders, setTestHeaders] = useState<KeyValuePair[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [testBody, setTestBody] = useState('{"hello":"world"}');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; statusText: string; body: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const captureUrl = webhookId ? `${API_BASE}/api/webhook/capture/${webhookId}` : null;

  const filteredWebhookRequests = useMemo(() => {
    const q = webhookSearch.toLowerCase().trim();
    if (!q) return webhookRequests;
    return webhookRequests.filter(
      (r) => r.method.toLowerCase().includes(q) || r.path.toLowerCase().includes(q) || r.body.toLowerCase().includes(q),
    );
  }, [webhookRequests, webhookSearch]);

  const createWebhook = async () => {
    setWebhookLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/webhook/create`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create webhook');
      setWebhookId(data.id);
      setWebhookRequests([]);
      setMockStatus(200);
      setMockHeaders([{ key: 'Content-Type', value: 'application/json' }]);
      setMockBody('{"ok":true}');
      setTestResult(null);
      setTestError(null);
      toast.success('New webhook URL created');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create webhook');
    } finally {
      setWebhookLoading(false);
    }
  };

  const fetchWebhookRequests = async (id: string): Promise<number | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/webhook/${id}/requests`);
      if (!res.ok) return null;
      const data = await res.json();
      const requests: CapturedRequest[] = data.requests || [];
      setWebhookRequests(requests);
      return requests.length;
    } catch {
      // Silent — a transient poll failure isn't worth surfacing to the user.
      return null;
    }
  };

  const handleManualRefresh = async () => {
    if (!webhookId || webhookRefreshing) return;
    setWebhookRefreshing(true);
    const before = webhookRequests.length;
    const after = await fetchWebhookRequests(webhookId);
    if (after === null) {
      toast.error('Refresh failed');
    } else {
      toast.success(after > before ? `Refreshed — ${after - before} new request${after - before > 1 ? 's' : ''}` : 'Refreshed — no new requests');
    }
    setWebhookRefreshing(false);
  };

  const clearWebhook = async () => {
    if (!webhookId) return;
    await fetch(`${API_BASE}/api/webhook/${webhookId}`, { method: 'DELETE' });
    setWebhookRequests([]);
    toast.success('Cleared captured requests');
  };

  const saveMockResponse = async () => {
    if (!webhookId) return;
    setSavingMock(true);
    try {
      const headersObj = Object.fromEntries(mockHeaders.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]));
      const res = await fetch(`${API_BASE}/api/webhook/${webhookId}/response`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: mockStatus, headers: headersObj, body: mockBody }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update response');
      toast.success('Mock response updated');
      setMockDialogOpen(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update response');
    } finally {
      setSavingMock(false);
    }
  };

  const openReplay = (reqId: string) => {
    setReplayState({ open: true, reqId, targetUrl: '', allowPrivate: false, loading: false, result: null, error: null });
  };

  const runReplay = async () => {
    if (!webhookId || !replayState.reqId || !replayState.targetUrl.trim()) return;
    setReplayState((s) => ({ ...s, loading: true, error: null, result: null }));
    try {
      const res = await fetch(`${API_BASE}/api/webhook/${webhookId}/requests/${replayState.reqId}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: replayState.targetUrl.trim(), allowPrivate: replayState.allowPrivate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Replay failed');
      setReplayState((s) => ({ ...s, result: data, loading: false }));
    } catch (e) {
      setReplayState((s) => ({ ...s, error: (e as Error).message || 'Replay failed', loading: false }));
    }
  };

  const sendTestRequest = async () => {
    if (!webhookId || !captureUrl) return;
    setTestSending(true);
    setTestError(null);
    setTestResult(null);
    try {
      const headersObj = Object.fromEntries(testHeaders.filter((h) => h.key.trim()).map((h) => [h.key.trim(), h.value]));
      const suffix = testPath.trim();
      const url = suffix ? `${captureUrl}${suffix.startsWith('/') ? '' : '/'}${suffix}` : captureUrl;
      const res = await fetch(url, {
        method: testMethod,
        headers: headersObj,
        body: testMethod !== 'GET' && testBody ? testBody : undefined,
      });
      const text = await res.text();
      setTestResult({ status: res.status, statusText: res.statusText, body: text });
      fetchWebhookRequests(webhookId);
    } catch (e) {
      setTestError((e as Error).message || 'Request failed');
    } finally {
      setTestSending(false);
    }
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

  const exportCurl = (req: CapturedRequest) => {
    if (!captureUrl) return;
    const qs = Object.entries(req.query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const url = `${captureUrl}${req.path === '/' ? '' : req.path}${qs ? `?${qs}` : ''}`;
    const cmd = buildCurlCommand({ method: req.method, url, headers: req.headers, body: req.body || undefined });
    handleCopy(cmd, 'curl command copied');
  };

  const exportJson = (req: CapturedRequest) => handleCopy(JSON.stringify(req, null, 2), 'Request JSON copied');

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
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Inspect</Label>
              <div className="flex gap-1.5">
                <Button
                  variant={!compareMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareMode(false)}
                  className="h-7 text-xs gap-1"
                >
                  Single
                </Button>
                <Button
                  variant={compareMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCompareMode(true)}
                  className="h-7 text-xs gap-1"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  Compare
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
              <Select value={inspectMethod} onValueChange={(v) => setInspectMethod(v as typeof inspectMethod)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="HEAD">HEAD</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="inspect-url"
                value={inspectUrl}
                onChange={(e) => setInspectUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (compareMode ? handleCompare() : handleInspect())}
                placeholder={compareMode ? 'https://example.com (URL A)' : 'https://example.com'}
                className="font-mono text-xs"
              />
            </div>

            {compareMode && (
              <Input
                value={inspectUrlB}
                onChange={(e) => setInspectUrlB(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
                placeholder="https://example.com (URL B)"
                className="font-mono text-xs"
              />
            )}

            {inspectMethod === 'POST' && (
              <div className="space-y-1">
                <Label className="text-xs">Request body</Label>
                <Textarea
                  value={inspectBody}
                  onChange={(e) => setInspectBody(e.target.value)}
                  placeholder='{"example":"payload"}'
                  className="font-mono text-xs min-h-[70px]"
                />
              </div>
            )}

            <details className="group">
              <summary className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground">
                <Settings2 className="h-3.5 w-3.5" />
                Advanced options
              </summary>
              <div className="mt-2 space-y-3 pl-1">
                <div className="space-y-1">
                  <Label className="text-xs">Custom request headers</Label>
                  <KeyValueEditor pairs={customHeaders} onChange={setCustomHeaders} />
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-2">
                    <Switch checked={followRedirects} onCheckedChange={setFollowRedirects} id="follow-redirects" />
                    <Label htmlFor="follow-redirects" className="text-xs font-normal cursor-pointer">
                      Follow redirects
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={allowPrivate} onCheckedChange={setAllowPrivate} id="allow-private" />
                    <Label htmlFor="allow-private" className="text-xs font-normal cursor-pointer">
                      Allow private/internal targets
                    </Label>
                  </div>
                </div>
                {allowPrivate && (
                  <p className="text-[10px] text-amber-500 flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    Permits reaching RFC1918/loopback/CGNAT addresses (e.g. your own LAN or localhost) so you can inspect
                    internal APIs. Cloud metadata and other reserved ranges stay blocked regardless.
                  </p>
                )}
              </div>
            </details>

            <Button
              onClick={compareMode ? handleCompare : handleInspect}
              disabled={inspecting}
              className="gap-1.5 w-full sm:w-auto"
            >
              {inspecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
              {compareMode ? 'Compare' : 'Inspect'}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Requests are fetched server-side (bypassing browser CORS). Private targets are blocked unless explicitly
              allowed above.
            </p>
          </CardContent>
        </Card>

        {!compareMode && inspectError && (
          <div className="flex items-center gap-2 p-3 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {inspectError}
          </div>
        )}
        {!compareMode && inspectResult && <InspectResultCard result={inspectResult} />}

        {compareMode && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {inspectError && (
                <div className="flex items-center gap-2 p-3 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {inspectError}
                </div>
              )}
              {inspectResult && <InspectResultCard result={inspectResult} label="URL A" />}
            </div>
            <div className="space-y-2">
              {inspectErrorB && (
                <div className="flex items-center gap-2 p-3 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {inspectErrorB}
                </div>
              )}
              {inspectResultB && <InspectResultCard result={inspectResultB} label="URL B" />}
            </div>
          </div>
        )}
        {compareMode && (inspectResult || inspectResultB) && <HeaderDiffTable a={inspectResult} b={inspectResultB} />}
      </TabsContent>

      {/* --- WEBHOOK TESTER TAB --- */}
      <TabsContent value="webhook-tester" className="space-y-3">
        {!webhookId ? (
          <Card className="border-dashed">
            <CardContent className="p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Webhook className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Spin up a live URL that captures any HTTP request sent to it — perfect for testing webhooks from Stripe, GitHub, Slack, or your own app.
              </p>
              <Button onClick={createWebhook} disabled={webhookLoading} className="gap-1.5 mt-1">
                {webhookLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Webhook className="h-4 w-4" />}
                Generate a webhook URL
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Compact header: capture URL + stats + actions */}
            <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/[0.04] to-transparent">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                    <Webhook className="h-4 w-4" />
                  </div>
                  <Input value={captureUrl ?? ''} readOnly className="font-mono text-xs h-8" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(captureUrl ?? '', 'Capture URL copied')} className="h-8 w-8 shrink-0" title="Copy capture URL">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className="border-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] gap-1">
                    <Webhook className="h-3 w-3" />
                    {webhookRequests.length} captured
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 font-normal text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    expires after 1h idle
                  </Badge>
                  <div className="flex gap-1.5 ml-auto">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleManualRefresh} disabled={webhookRefreshing} title="Refresh now">
                      <RefreshCcw className={`h-3.5 w-3.5 ${webhookRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setMockDialogOpen(true)} title="Configure mock response">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={clearWebhook} title="Clear captured requests">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={createWebhook} className="h-7 text-xs gap-1">
                      New URL
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collapsed by default — a power-user action, kept out of the way of the captured-requests list */}
            <Card>
              <CardContent className="p-0">
                <details className="group">
                  <summary className="flex items-center gap-2 p-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                    <Send className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Send a test request</span>
                    <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">no curl needed</span>
                  </summary>
                  <div className="px-4 pb-4 space-y-3 border-t pt-3">
                    <div className="grid gap-2 sm:grid-cols-[110px_1fr]">
                      <Select value={testMethod} onValueChange={(v) => setTestMethod(v as typeof testMethod)}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={testPath}
                        onChange={(e) => setTestPath(e.target.value)}
                        placeholder="/optional/path?query=value"
                        className="font-mono text-xs"
                      />
                    </div>
                    <details className="group/inner">
                      <summary className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground list-none [&::-webkit-details-marker]:hidden">
                        <ChevronRight className="h-3 w-3 transition-transform group-open/inner:rotate-90" />
                        Headers &amp; body
                      </summary>
                      <div className="mt-2 space-y-3 pl-1">
                        <div className="space-y-1">
                          <Label className="text-xs">Request headers</Label>
                          <KeyValueEditor pairs={testHeaders} onChange={setTestHeaders} />
                        </div>
                        {testMethod !== 'GET' && (
                          <div className="space-y-1">
                            <Label className="text-xs">Request body</Label>
                            <Textarea
                              value={testBody}
                              onChange={(e) => setTestBody(e.target.value)}
                              className="font-mono text-xs min-h-[70px]"
                            />
                          </div>
                        )}
                      </div>
                    </details>
                    <Button onClick={sendTestRequest} disabled={testSending} size="sm" className="gap-1.5 text-xs h-8">
                      {testSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Send
                    </Button>
                    {testError && (
                      <div className="flex items-center gap-2 p-2.5 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {testError}
                      </div>
                    )}
                    {testResult && (
                      <div className="border rounded-md p-2.5 space-y-1.5 text-xs font-mono">
                        <Badge className={`border-0 ${statusBadgeClass(testResult.status)}`}>
                          {testResult.status} {testResult.statusText}
                        </Badge>
                        <pre className="text-muted-foreground whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                          {tryPrettyJson(testResult.body) ?? (testResult.body || '(empty)')}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>

            {/* Primary content — captured requests, front and center */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Badge className="border-0 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] gap-1">
                    {filteredWebhookRequests.length}/{webhookRequests.length} requests
                  </Badge>
                  <div className="relative w-full max-w-[220px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={webhookSearch}
                      onChange={(e) => setWebhookSearch(e.target.value)}
                      placeholder="Filter by method, path, body..."
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>
                {webhookRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500" />
                    </span>
                    <p className="text-sm font-medium">Waiting for a request...</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      Send one to your capture URL above, or expand "Send a test request" to fire one right here.
                    </p>
                  </div>
                ) : filteredWebhookRequests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No captured requests match your filter.</p>
                ) : (
                  <div className="border rounded-md divide-y max-h-[65vh] overflow-y-auto">
                    {filteredWebhookRequests.map((req, idx) => {
                      const isExpanded = expandedRequests.has(req.id);
                      const pretty = tryPrettyJson(req.body);
                      const isNew = idx === 0 && Date.now() - new Date(req.receivedAt).getTime() < 10_000;
                      return (
                        <div key={req.id} className={`border-l-4 ${methodBorderClass(req.method)}`}>
                          <button
                            onClick={() => toggleExpanded(req.id)}
                            className="w-full flex items-center gap-2 p-2.5 text-xs font-mono hover:bg-muted/30 text-left"
                          >
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                            <Badge className={`border-0 text-[10px] ${methodBadgeClass(req.method)}`}>{req.method}</Badge>
                            {isNew && (
                              <Badge className="border-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5">
                                NEW
                              </Badge>
                            )}
                            <span className="truncate">{req.path}</span>
                            <span className="ml-auto text-muted-foreground shrink-0" title={new Date(req.receivedAt).toLocaleString()}>
                              {timeAgo(req.receivedAt)}
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="p-3 bg-muted/20 text-xs font-mono space-y-2 border-t">
                              <div className="flex flex-wrap gap-1.5 pb-1">
                                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => exportCurl(req)}>
                                  <Terminal className="h-3 w-3" />
                                  Copy as curl
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => exportJson(req)}>
                                  <Braces className="h-3 w-3" />
                                  Copy as JSON
                                </Button>
                                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => openReplay(req.id)}>
                                  <Send className="h-3 w-3" />
                                  Replay
                                </Button>
                              </div>
                              <div>
                                <span className="font-bold text-sky-600 dark:text-sky-400">Headers</span>
                                <div className="pl-2 text-muted-foreground">
                                  {Object.entries(req.headers).map(([k, v]) => (
                                    <div key={k} className="break-all">{k}: {v}</div>
                                  ))}
                                </div>
                              </div>
                              {Object.keys(req.query).length > 0 && (
                                <div>
                                  <span className="font-bold text-violet-600 dark:text-violet-400">Query</span>
                                  <div className="pl-2 text-muted-foreground break-all">{JSON.stringify(req.query)}</div>
                                </div>
                              )}
                              <div>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  Body{req.bodyTruncated ? ' (truncated)' : ''}{pretty ? ' (JSON)' : ''}
                                </span>
                                <pre className="pl-2 text-muted-foreground break-all whitespace-pre-wrap">{pretty ?? (req.body || '(empty)')}</pre>
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
          </>
        )}
      </TabsContent>

      {/* --- MOCK RESPONSE DIALOG --- */}
      <Dialog open={mockDialogOpen} onOpenChange={setMockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure mock response</DialogTitle>
            <DialogDescription>
              This status, headers, and body are returned to whatever sends a request to your capture URL — useful for
              testing how a sender handles success/error responses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Status code</Label>
              <Input
                type="number"
                min={100}
                max={599}
                value={mockStatus}
                onChange={(e) => setMockStatus(Number(e.target.value) || 200)}
                className="font-mono text-xs h-9 w-28"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Response headers</Label>
              <KeyValueEditor pairs={mockHeaders} onChange={setMockHeaders} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Response body</Label>
              <Textarea
                value={mockBody}
                onChange={(e) => setMockBody(e.target.value)}
                className="font-mono text-xs min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveMockResponse} disabled={savingMock} className="gap-1.5">
              {savingMock ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- REPLAY DIALOG --- */}
      <Dialog open={replayState.open} onOpenChange={(open) => setReplayState((s) => ({ ...s, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Replay captured request</DialogTitle>
            <DialogDescription>Re-send this request's method, headers, and body to a target URL of your choice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Target URL</Label>
              <Input
                value={replayState.targetUrl}
                onChange={(e) => setReplayState((s) => ({ ...s, targetUrl: e.target.value }))}
                placeholder="https://your-api.example.com/webhook"
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={replayState.allowPrivate}
                onCheckedChange={(v) => setReplayState((s) => ({ ...s, allowPrivate: v }))}
                id="replay-allow-private"
              />
              <Label htmlFor="replay-allow-private" className="text-xs font-normal cursor-pointer">
                Allow private/internal targets
              </Label>
            </div>
            {replayState.error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {replayState.error}
              </div>
            )}
            {replayState.result && (
              <div className="border rounded-md p-2.5 space-y-1.5 text-xs font-mono">
                <Badge className={`border-0 ${statusBadgeClass(replayState.result.status)}`}>
                  {replayState.result.status} {replayState.result.statusText}
                </Badge>
                <span className="text-muted-foreground ml-2">{replayState.result.timingMs}ms</span>
                <div className="pl-1 text-muted-foreground max-h-32 overflow-y-auto">
                  {Object.entries(replayState.result.headers).map(([k, v]) => (
                    <div key={k} className="break-all">{k}: {v}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={runReplay} disabled={replayState.loading || !replayState.targetUrl.trim()} className="gap-1.5">
              {replayState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
