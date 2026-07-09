'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  Clock, 
  Navigation,
  Compass,
  Cpu,
  RefreshCw,
  Hash,
  Fingerprint,
  Zap,
  Play,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/context/LocalizationContext';
import { toast } from 'sonner';

interface IpInfo {
  ip: string;
  network?: string;
  version?: string;
  city?: string;
  region?: string;
  country_name?: string;
  country_code?: string;
  postal?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  utc_offset?: string;
  country_calling_code?: string;
  currency?: string;
  org?: string;
  asn?: string;
  error?: boolean;
  reason?: string;
}

const DISPOSABLE_DOMAINS = [
  'yopmail.com', 'mailinator.com', 'tempmail.com', 'temp-mail.org', 
  '10minutemail.com', 'guerrillamail.com', 'dispostable.com', 
  'getairmail.com', 'trashmail.com', 'sharklasers.com', 
  'guerrillamailblock.com', 'guerrillamail.net', 'guerrillamail.org',
  'temp-mail.ru', 'temp-mail.cc'
];

const COUNTRY_CALLING_CODES: Record<string, { country: string; code: string; flag: string }> = {
  '1': { country: 'United States / Canada', code: 'US', flag: '🇺🇸' },
  '7': { country: 'Russia / Kazakhstan', code: 'RU', flag: '🇷🇺' },
  '20': { country: 'Egypt', code: 'EG', flag: '🇪🇬' },
  '27': { country: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  '30': { country: 'Greece', code: 'GR', flag: '🇬🇷' },
  '31': { country: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  '32': { country: 'Belgium', code: 'BE', flag: '🇧🇪' },
  '33': { country: 'France', code: 'FR', flag: '🇫🇷' },
  '34': { country: 'Spain', code: 'ES', flag: '🇪🇸' },
  '36': { country: 'Hungary', code: 'HU', flag: '🇭🇺' },
  '39': { country: 'Italy', code: 'IT', flag: '🇮🇹' },
  '40': { country: 'Romania', code: 'RO', flag: '🇷🇴' },
  '41': { country: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  '43': { country: 'Austria', code: 'AT', flag: '🇦🇹' },
  '44': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  '45': { country: 'Denmark', code: 'DK', flag: '🇩🇰' },
  '46': { country: 'Sweden', code: 'SE', flag: '🇸🇪' },
  '47': { country: 'Norway', code: 'NO', flag: '🇳🇴' },
  '48': { country: 'Poland', code: 'PL', flag: '🇵🇱' },
  '49': { country: 'Germany', code: 'DE', flag: '🇩🇪' },
  '51': { country: 'Peru', code: 'PE', flag: '🇵🇪' },
  '52': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
  '54': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
  '55': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
  '56': { country: 'Chile', code: 'CL', flag: '🇨🇱' },
  '57': { country: 'Colombia', code: 'CO', flag: '🇨🇴' },
  '58': { country: 'Venezuela', code: 'VE', flag: '🇻🇪' },
  '60': { country: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  '61': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
  '62': { country: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  '63': { country: 'Philippines', code: 'PH', flag: '🇵🇭' },
  '64': { country: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  '65': { country: 'Singapore', code: 'SG', flag: '🇸🇬' },
  '66': { country: 'Thailand', code: 'TH', flag: '🇹🇭' },
  '81': { country: 'Japan', code: 'JP', flag: '🇯🇵' },
  '82': { country: 'South Korea', code: 'KR', flag: '🇰🇷' },
  '84': { country: 'Vietnam', code: 'VN', flag: '🇻🇳' },
  '86': { country: 'China', code: 'CN', flag: '🇨🇳' },
  '90': { country: 'Turkey', code: 'TR', flag: '🇹🇷' },
  '91': { country: 'India', code: 'IN', flag: '🇮🇳' },
  '92': { country: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  '93': { country: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  '94': { country: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  '95': { country: 'Myanmar', code: 'MM', flag: '🇲🇲' },
  '98': { country: 'Iran', code: 'IR', flag: '🇮🇷' },
  '351': { country: 'Portugal', code: 'PT', flag: '🇵🇹' },
  '352': { country: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
  '353': { country: 'Ireland', code: 'IE', flag: '🇮🇪' },
  '354': { country: 'Iceland', code: 'IS', flag: '🇮🇸' },
  '358': { country: 'Finland', code: 'FI', flag: '🇫🇮' },
  '380': { country: 'Ukraine', code: 'UA', flag: '🇺🇦' },
  '971': { country: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  '972': { country: 'Israel', code: 'IL', flag: '🇮🇱' },
  '974': { country: 'Qatar', code: 'QA', flag: '🇶🇦' },
  '977': { country: 'Nepal', code: 'NP', flag: '🇳🇵' }
};

const pingWithImage = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const img = new Image();
    
    const timeout = setTimeout(() => {
      img.src = '';
      reject(new Error('Timeout'));
    }, 4000);
    
    img.onload = () => {
      clearTimeout(timeout);
      const end = performance.now();
      resolve(Math.round(end - start));
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      const end = performance.now();
      resolve(Math.round(end - start));
    };
    
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    
    try {
      const parsed = new URL(targetUrl);
      const separator = parsed.search ? '&' : '?';
      img.src = `${parsed.origin}/favicon.ico${separator}cb=${Date.now()}-${Math.random()}`;
    } catch (e) {
      clearTimeout(timeout);
      reject(e);
    }
  });
};

export function IpIntelTool() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'ip' | 'identity' | 'ping'>('ip');

  // IP states
  const [userIpInfo, setUserIpInfo] = useState<IpInfo | null>(null);
  const [lookupIp, setLookupIp] = useState('');
  const [searchResult, setSearchResult] = useState<IpInfo | null>(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userIpv4, setUserIpv4] = useState<string | null>(null);
  const [userIpv6, setUserIpv6] = useState<string | null>(null);
  const [copiedIpv4, setCopiedIpv4] = useState(false);
  const [copiedIpv6, setCopiedIpv6] = useState(false);

  // Identity states
  const [inputVal, setInputVal] = useState('');
  const [validationResult, setValidationResult] = useState<any | null>(null);

  // Ping Test states
  const [customPingUrl, setCustomPingUrl] = useState('https://google.com');
  const [pingTargets, setPingTargets] = useState<any[]>([
    { name: 'Cloudflare DNS', url: 'https://1.1.1.1', desc: 'Anycast DNS Gateway', status: 'idle', min: null, max: null, avg: null, jitter: null, history: [] },
    { name: 'Google Server', url: 'https://www.google.com', desc: 'Google search platform gateway', status: 'idle', min: null, max: null, avg: null, jitter: null, history: [] },
  ]);
  const [isPingingAll, setIsPingingAll] = useState(false);

  const runPingTest = async (targetIdx: number) => {
    const nextTargets = [...pingTargets];
    const target = nextTargets[targetIdx];
    
    target.status = 'running';
    target.history = [];
    target.min = null;
    target.max = null;
    target.avg = null;
    target.jitter = null;
    setPingTargets([...nextTargets]);

    const numTests = 4;
    const history: number[] = [];

    for (let i = 0; i < numTests; i++) {
      try {
        const rtt = await pingWithImage(target.url);
        history.push(rtt);
      } catch (err) {
        console.warn(`Ping attempt ${i} failed for ${target.url}`, err);
      }
      await new Promise(r => setTimeout(r, 120));
    }

    if (history.length > 0) {
      const min = Math.min(...history);
      const max = Math.max(...history);
      const avg = Math.round(history.reduce((a, b) => a + b, 0) / history.length);
      
      let diffSum = 0;
      for (let i = 1; i < history.length; i++) {
        diffSum += Math.abs(history[i] - history[i - 1]);
      }
      const jitter = history.length > 1 ? Math.round(diffSum / (history.length - 1)) : 0;

      target.status = 'done';
      target.history = history;
      target.min = min;
      target.max = max;
      target.avg = avg;
      target.jitter = jitter;
    } else {
      target.status = 'failed';
    }

    setPingTargets([...nextTargets]);
  };

  const handlePingAll = async () => {
    setIsPingingAll(true);
    for (let i = 0; i < pingTargets.length; i++) {
      await runPingTest(i);
    }
    setIsPingingAll(false);
  };

  const handleAddCustomPing = () => {
    let url = customPingUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    try {
      const parsed = new URL(url);
      const newTarget = {
        name: `Custom (${parsed.hostname})`,
        url: parsed.origin,
        desc: `User specified URL: ${parsed.hostname}`,
        status: 'idle',
        min: null,
        max: null,
        avg: null,
        jitter: null,
        history: [],
      };
      setPingTargets([...pingTargets, newTarget]);
      setCustomPingUrl('');
      toast.success('Custom target endpoint added!');
    } catch {
      toast.error('Invalid URL format');
    }
  };

  const handleRemovePingTarget = (idx: number) => {
    setPingTargets(pingTargets.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    // Fetch current user IP and both protocols on mount
    fetchUserIp();
    fetchIpv4();
    fetchIpv6();
  }, []);

  const fetchIpv4 = async () => {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (res.ok) {
        const data = await res.json();
        setUserIpv4(data.ip);
      }
    } catch (e) {
      console.warn('IPv4 discovery failed:', e);
    }
  };

  const fetchIpv6 = async () => {
    try {
      const res = await fetch('https://api6.ipify.org?format=json');
      if (res.ok) {
        const data = await res.json();
        setUserIpv6(data.ip);
      }
    } catch (e) {
      console.warn('IPv6 discovery failed (host may not support IPv6 routing):', e);
    }
  };

  const fetchUserIp = async () => {
    setIpLoading(true);
    setIpError(null);

    // Equivalent to Node package: var ipapi = require('ipapi.co');
    const mapIpApiCo = (d: any): IpInfo => ({
      ip: d.ip,
      version: d.version,
      city: d.city,
      region: d.region,
      country_name: d.country_name,
      country_code: d.country_code,
      postal: d.postal,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone,
      utc_offset: d.utc_offset,
      country_calling_code: d.country_calling_code,
      currency: d.currency,
      org: d.org,
      asn: d.asn,
    });

    const mapIpWhoIs = (d: any): IpInfo => ({
      ip: d.ip,
      version: d.type,
      city: d.city,
      region: d.region,
      country_name: d.country,
      country_code: d.country_code,
      postal: d.postal_code || d.postal,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone?.id,
      utc_offset: d.timezone?.utc,
      org: d.connection?.org || d.connection?.isp,
      asn: d.connection?.asn ? `AS${d.connection.asn}` : undefined,
    });

    try {
      // 1. Try ipapi.co (HTTPS, CORS-enabled, keyless)
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('ipapi.co failed');
      const data = await res.json();
      if (data.error) throw new Error(data.reason || 'ipapi.co failed');
      const info = mapIpApiCo(data);
      setUserIpInfo(info);
      setSearchResult(info);
    } catch (err: any) {
      console.warn('Primary IP API failed, trying ipwho.is...', err);
      try {
        // 2. Try ipwho.is (HTTPS, CORS-enabled, keyless)
        const res = await fetch('https://ipwho.is/');
        if (!res.ok) throw new Error('ipwho.is failed');
        const data = await res.json();
        if (data.success === false) throw new Error(data.message || 'ipwho.is failed');
        const info = mapIpWhoIs(data);
        setUserIpInfo(info);
        setSearchResult(info);
      } catch (err2: any) {
        console.warn('Secondary IP API failed, trying api.ipify.org...', err2);
        try {
          // 3. Try ipify (gets IP address only)
          const res = await fetch('https://api.ipify.org?format=json');
          if (!res.ok) throw new Error('api.ipify.org failed');
          const data = await res.json();
          const fallback: IpInfo = {
            ip: data.ip,
            city: 'Geodata unavailable',
            country_name: 'Unknown',
            org: 'Lookup services rate limited/offline',
          };
          setUserIpInfo(fallback);
          setSearchResult(fallback);
        } catch {
          setIpError('All IP discovery services are offline.');
        }
      }
    } finally {
      setIpLoading(false);
    }
  };

  const handleIpLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupIp.trim()) return;

    setIpLoading(true);
    setIpError(null);
    const trimmedIp = lookupIp.trim();

    // Equivalent to Node package: var ipapi = require('ipapi.co');
    const mapIpApiCo = (d: any): IpInfo => ({
      ip: d.ip,
      version: d.version,
      city: d.city,
      region: d.region,
      country_name: d.country_name,
      country_code: d.country_code,
      postal: d.postal,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone,
      utc_offset: d.utc_offset,
      country_calling_code: d.country_calling_code,
      currency: d.currency,
      org: d.org,
      asn: d.asn,
    });

    const mapIpWhoIs = (d: any): IpInfo => ({
      ip: d.ip,
      version: d.type,
      city: d.city,
      region: d.region,
      country_name: d.country,
      country_code: d.country_code,
      postal: d.postal_code || d.postal,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone?.id,
      utc_offset: d.timezone?.utc,
      org: d.connection?.org || d.connection?.isp,
      asn: d.connection?.asn ? `AS${d.connection.asn}` : undefined,
    });

    try {
      // 1. Try ipapi.co (HTTPS, CORS-enabled, keyless)
      const res = await fetch(`https://ipapi.co/${trimmedIp}/json/`);
      if (!res.ok) throw new Error('ipapi.co lookup failed');
      const data = await res.json();
      if (data.error) throw new Error(data.reason || 'ipapi.co lookup failed');
      const info = mapIpApiCo(data);
      setSearchResult(info);
    } catch (err: any) {
      console.warn('Primary lookup failed, trying ipwho.is...', err);
      try {
        // 2. Try ipwho.is (HTTPS, CORS-enabled, keyless)
        const res = await fetch(`https://ipwho.is/${encodeURIComponent(trimmedIp)}`);
        if (!res.ok) throw new Error('ipwho.is failed');
        const data = await res.json();
        if (data.success === false) throw new Error(data.message || 'Invalid IP address.');
        const info = mapIpWhoIs(data);
        setSearchResult(info);
      } catch (err2: any) {
        console.warn('Secondary lookup failed, trying api.ipify.org fallback...', err2);
        try {
          // 3. Try ipify fallback
          const res = await fetch('https://api.ipify.org?format=json');
          if (!res.ok) throw new Error('api.ipify.org failed');
          const data = await res.json();
          setSearchResult({
            ip: trimmedIp,
            city: 'Geodata unavailable',
            country_name: 'Unknown',
            org: 'Lookup services rate limited/offline',
          });
        } catch (err3: any) {
          setIpError(err3.message || 'Lookup failed. Verify target IP format and connectivity.');
          setSearchResult(null);
        }
      }
    } finally {
      setIpLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Helper to determine flag emoji
  const getFlagEmoji = (countryCode?: string) => {
    if (!countryCode) return '🌐';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  };

  // Identity logic
  const handleValidateIdentity = (val: string) => {
    setInputVal(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setValidationResult(null);
      return;
    }

    // Check if email
    if (trimmed.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(trimmed);
      
      let domain = '';
      let localPart = '';
      if (isValidFormat) {
        const parts = trimmed.split('@');
        localPart = parts[0];
        domain = parts[1].toLowerCase();
      } else {
        const parts = trimmed.split('@');
        if (parts.length > 1) domain = parts[1].toLowerCase();
      }

      const isDisposable = DISPOSABLE_DOMAINS.includes(domain);
      const isCommonProvider = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'].includes(domain);

      // Estimate deliverability
      let score = 0;
      let notes: string[] = [];

      if (isValidFormat) {
        score += 40;
        notes.push('Valid syntax format syntax check passed.');
      } else {
        notes.push('Invalid syntax format representation.');
      }

      if (domain) {
        if (isDisposable) {
          score -= 30;
          notes.push('Known disposable temp-email service flagged.');
        } else if (isCommonProvider) {
          score += 50;
          notes.push('Reputable global mail provider host verified.');
        } else {
          score += 30;
          notes.push('Custom organization/business domain configuration.');
        }
      }

      const finalScore = Math.max(0, Math.min(100, score));

      setValidationResult({
        type: 'email',
        isValid: isValidFormat && !isDisposable,
        details: [
          { label: 'Syntax Validity', value: isValidFormat ? 'Valid' : 'Malformed', status: isValidFormat ? 'success' : 'error' },
          { label: 'Mailbox Name', value: localPart || 'N/A' },
          { label: 'Domain Address', value: domain || 'N/A' },
          { label: 'Disposable Service', value: isDisposable ? 'Yes (Risky)' : 'No (Safe)', status: isDisposable ? 'error' : 'success' },
          { label: 'Trust Rating', value: `${finalScore}/100`, status: finalScore > 60 ? 'success' : finalScore > 30 ? 'warning' : 'error' }
        ],
        notes
      });
    } else {
      // Validate phone number
      // Remove spaces, brackets, hyphens
      const cleaned = trimmed.replace(/[\s\(\)\-\.]/g, '');
      const hasPlus = cleaned.startsWith('+');
      const numericPart = cleaned.replace(/^\+/, '');
      const isNumeric = /^\d+$/.test(numericPart);
      const lengthValid = numericPart.length >= 7 && numericPart.length <= 15;

      let matchedCountry = 'Unknown';
      let matchedCode = 'N/A';
      let matchedFlag = '🏳️';
      let phoneCallingCode = '';

      if (isNumeric) {
        // Try to match calling codes
        // Sort keys by length desc to prevent premature matches (e.g. +351 vs +3)
        const sortedCodes = Object.keys(COUNTRY_CALLING_CODES).sort((a, b) => b.length - a.length);
        
        for (const code of sortedCodes) {
          if (numericPart.startsWith(code)) {
            const entry = COUNTRY_CALLING_CODES[code];
            matchedCountry = entry.country;
            matchedCode = entry.code;
            matchedFlag = entry.flag;
            phoneCallingCode = `+${code}`;
            break;
          }
        }
      }

      const isValid = isNumeric && lengthValid && (hasPlus || phoneCallingCode !== '');
      let notes: string[] = [];

      if (!isValid) {
        if (!isNumeric) notes.push('Contains invalid non-numeric symbols.');
        if (!lengthValid) notes.push('Length should be between 7 and 15 digits (ITU E.164 specification).');
        if (!hasPlus && phoneCallingCode === '') notes.push('Missing country dial-in prefix symbol (+).');
      } else {
        notes.push('E.164 structured dial format compliant.');
        if (matchedCountry !== 'Unknown') {
          notes.push(`Region matched to ${matchedCountry} (${phoneCallingCode}).`);
        }
      }

      setValidationResult({
        type: 'phone',
        isValid,
        details: [
          { label: 'Format Compliance', value: isValid ? 'Compliant' : 'Invalid Format', status: isValid ? 'success' : 'error' },
          { label: 'Cleaned String', value: cleaned },
          { label: 'Matched Country', value: `${matchedFlag} ${matchedCountry}` },
          { label: 'Country Code', value: matchedCode },
          { label: 'International Prefix', value: phoneCallingCode || 'Not detected' }
        ],
        notes
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border/80">
        <button
          onClick={() => setActiveTab('ip')}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'ip' 
              ? 'border-primary text-primary' 
               : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Globe className="h-4 w-4" />
          IP Intelligence
        </button>
        <button
          onClick={() => setActiveTab('identity')}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'identity' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Fingerprint className="h-4 w-4" />
          Identity Validator
        </button>
        <button
          onClick={() => setActiveTab('ping')}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'ping' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="h-4 w-4" />
          Ping Latency Test
        </button>
      </div>

      {activeTab === 'ip' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lookup Input */}
          <div className="lg:col-span-12">
            <Card className="bg-card/45 border-primary/20 shadow-md backdrop-blur-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleIpLookup} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter IPv4 or IPv6 (e.g. 8.8.8.8, 2001:4860:4860::8888)"
                      className="pl-9 h-11 bg-background/50"
                      value={lookupIp}
                      onChange={(e) => setLookupIp(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-11 font-bold" disabled={ipLoading}>
                    {ipLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                    Lookup
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    className="h-11 font-bold" 
                    onClick={fetchUserIp}
                    disabled={ipLoading}
                  >
                    My IP
                  </Button>
                </form>
                {ipError && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    {ipError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Client IPs Copy Banner */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/10 border-border/80 shadow-sm backdrop-blur-sm">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                    IPv4
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold leading-none">Client IPv4</p>
                    <p className="font-mono text-xs font-black mt-1">{userIpv4 || 'Resolving...'}</p>
                  </div>
                </div>
                {userIpv4 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-muted/80 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(userIpv4);
                      setCopiedIpv4(true);
                      setTimeout(() => setCopiedIpv4(false), 1500);
                    }}
                  >
                    {copiedIpv4 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground/80" />}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/10 border-border/80 shadow-sm backdrop-blur-sm">
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-500 font-bold text-[10px] uppercase tracking-wider">
                    IPv6
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-semibold leading-none">Client IPv6</p>
                    <p className="font-mono text-xs font-black mt-1 truncate" title={userIpv6 || 'Not detected'}>
                      {userIpv6 || 'Not detected'}
                    </p>
                  </div>
                </div>
                {userIpv6 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-muted/80 shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(userIpv6);
                      setCopiedIpv6(true);
                      setTimeout(() => setCopiedIpv6(false), 1500);
                    }}
                  >
                    {copiedIpv6 ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground/80" />}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-8 space-y-6">
            {searchResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Main Identity Info */}
                <Card className="bg-card/45 border-border/80 md:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <span className="text-2xl">{getFlagEmoji(searchResult.country_code)}</span>
                          {searchResult.ip}
                        </CardTitle>
                        <CardDescription className="font-semibold text-xs mt-1">
                          {searchResult.org || 'Local ISP'} (ASN: {searchResult.asn || 'N/A'})
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs uppercase">
                        {searchResult.version || 'IPv4'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0">
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Location</p>
                        <p className="text-xs font-bold mt-0.5">
                          {searchResult.city ? `${searchResult.city}, ` : ''}
                          {searchResult.region ? `${searchResult.region}, ` : ''}
                          {searchResult.country_name || 'Unknown Country'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Timezone</p>
                        <p className="text-xs font-bold mt-0.5">
                          {searchResult.timezone || 'N/A'} ({searchResult.utc_offset || 'UTC'})
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-center gap-3">
                      <Navigation className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Coordinates</p>
                        <p className="text-xs font-bold mt-0.5">
                          Lat: {searchResult.latitude || '0.0'}, Lon: {searchResult.longitude || '0.0'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 flex items-center gap-3">
                      <Compass className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Network Block</p>
                        <p className="text-xs font-bold mt-0.5">
                          {searchResult.network || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Additional Geo Details */}
                <Card className="bg-card/45 border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Geography Specs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-sm pt-0">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Postal / Zip Code:</span>
                      <span className="font-bold">{searchResult.postal || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Calling Dial Code:</span>
                      <span className="font-bold">{searchResult.country_calling_code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-muted-foreground">Local Currency:</span>
                      <span className="font-bold text-emerald-500">{searchResult.currency || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* ASN Details */}
                <Card className="bg-card/45 border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Connection & Host</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3.5 text-sm pt-0">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">ISP Network:</span>
                      <span className="font-bold truncate max-w-[150px]">{searchResult.org || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">ASN Number:</span>
                      <span className="font-bold font-mono text-xs">{searchResult.asn || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-muted-foreground">Address Class:</span>
                      <span className="font-bold font-mono text-xs uppercase">{searchResult.version || 'IPv4'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Visual Position Radar Map */}
                {searchResult.latitude && searchResult.longitude && (
                  <Card className="bg-card/45 border-border/80 md:col-span-2 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-primary" /> Visual Position Radar Map
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="w-full h-56 rounded-xl overflow-hidden border border-border/60 relative bg-muted/20">
                        <iframe
                          title="Geographic Position Map"
                          width="100%"
                  height="100%"
                          frameBorder="0"
                          scrolling="no"
                          marginHeight={0}
                          marginWidth={0}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${searchResult.longitude - 0.025}%2C${searchResult.latitude - 0.025}%2C${searchResult.longitude + 0.025}%2C${searchResult.latitude + 0.025}&layer=mapnik&marker=${searchResult.latitude}%2C${searchResult.longitude}`}
                          className="w-full h-full grayscale invert opacity-75 contrast-125 brightness-90 hover:opacity-90 transition-opacity"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Raw JSON View */}
          <div className="lg:col-span-4">
            <Card className="bg-card/45 border-border/80 h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Raw Response</CardTitle>
                  {searchResult && (
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={() => copyToClipboard(JSON.stringify(searchResult, null, 2), 'json')}
                    >
                      {copiedKey === 'json' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px] lg:min-h-0 pt-0">
                <div className="h-full bg-muted/40 rounded-xl border border-border/50 p-4 font-mono text-[10px] text-muted-foreground overflow-y-auto leading-relaxed select-text max-h-[360px] lg:max-h-none">
                  {searchResult ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(searchResult, null, 2)}</pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center">
                      <Cpu className="h-8 w-8 text-muted-foreground/30 animate-pulse mb-2 block mx-auto" />
                      <p>Run lookup to populate metadata.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}


      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Identity Validator Input */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-card/45 border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold">Verification Engine</CardTitle>
                <CardDescription>
                  Enter any Email or Phone number (with country dial code, e.g., +91, +1, +44) to run validation tests.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter email or international phone number..."
                    className="h-11 bg-background/50 font-medium"
                    value={inputVal}
                    onChange={(e) => handleValidateIdentity(e.target.value)}
                  />
                </div>
                
                {validationResult ? (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Verification Checklists</h4>
                    <div className="space-y-2">
                      {validationResult.notes.map((note: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          {validationResult.isValid ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <span className="text-muted-foreground">{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground bg-muted/20 border border-dashed rounded-xl">
                    <Hash className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs">Awaiting input stream to analyze metadata details.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Validation Details */}
          <div className="lg:col-span-7">
            <Card className="bg-card/45 border-border/80 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Intelligence Report</span>
                  {validationResult && (
                    <Badge variant={validationResult.isValid ? 'success' : 'destructive'} className="text-xs font-bold uppercase tracking-wider">
                      {validationResult.isValid ? 'Verified' : 'Invalid'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {validationResult ? (
                  <div className="space-y-4">
                    <div className="grid gap-2 text-sm">
                      {validationResult.details.map((detail: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center border-b border-border/40 pb-2.5 last:border-b-0">
                          <span className="text-muted-foreground">{detail.label}:</span>
                          {detail.status ? (
                            <Badge 
                              variant={
                                detail.status === 'success' 
                                  ? 'success' 
                                  : detail.status === 'warning' 
                                    ? 'warning' 
                                    : 'destructive'
                              }
                              className="font-bold text-xs"
                            >
                              {detail.value}
                            </Badge>
                          ) : (
                            <span className="font-bold font-mono text-xs">{detail.value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border border-border/50 mt-4 flex items-start gap-2.5">
                      {validationResult.type === 'email' ? (
                        <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-primary">Validator Summary</h5>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {validationResult.type === 'email' 
                            ? 'Email structures undergo basic syntax validity constraints and cross-reference common disposable temp-mail registries to ensure safe subscriber flows.' 
                            : 'Phone structures are checked against ITU-T E.164 standards, matching international prefix dialers to determine geo-routing regions.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-muted-foreground text-center">
                    <Cpu className="h-8 w-8 text-muted-foreground/30 animate-pulse mb-2" />
                    <p className="text-sm">Type an email address or mobile phone above to see structural analysis reports.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'ping' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Target List */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="bg-card/45 border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-bold">Latency Telemetry</CardTitle>
                    <CardDescription>Measure HTTP Round-Trip Time (RTT) to global targets.</CardDescription>
                  </div>
                  <Button size="sm" onClick={handlePingAll} disabled={isPingingAll} className="gap-1.5 h-8.5 font-bold">
                    <RefreshCw className={`h-3.5 w-3.5 ${isPingingAll ? 'animate-spin' : ''}`} />
                    Test All Links
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin">
                  {pingTargets.map((target, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border rounded-xl p-3 bg-muted/15 text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{target.name}</span>
                        <Badge variant="secondary" className="font-mono text-[9px] h-4.5">{target.url}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{target.desc}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      {target.status === 'running' && (
                        <span className="flex items-center gap-1 text-primary font-semibold font-mono animate-pulse">
                          <RefreshCw className="h-3 w-3 animate-spin" /> Timing...
                        </span>
                      )}
                      {target.status === 'failed' && (
                        <span className="text-red-500 font-bold font-mono">Offline / Blocked</span>
                      )}
                      {target.status === 'done' && (
                        <div className="flex items-center gap-3 font-mono text-[11px] text-foreground">
                          <div className="text-right">
                            <p className="font-extrabold text-primary">{target.avg} ms <span className="font-normal text-muted-foreground text-[9px]">avg</span></p>
                            <p className="text-[9px] text-muted-foreground">min: {target.min}ms • max: {target.max}ms</p>
                          </div>
                          <div className="text-right border-l pl-3">
                            <p className="font-semibold text-foreground">{target.jitter} ms</p>
                            <p className="text-[9px] text-muted-foreground">jitter</p>
                          </div>
                        </div>
                      )}
                      {target.status === 'idle' && (
                        <span className="text-muted-foreground/60 italic font-mono">Not tested</span>
                      )}

                      <div className="flex gap-1 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={() => runPingTest(idx)}
                          disabled={target.status === 'running'}
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                        </Button>
                        {target.name.startsWith('Custom') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => handleRemovePingTarget(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Custom URL Panel */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-card/45 border-border/80 shadow-sm h-fit">
              <CardHeader>
                <CardTitle className="text-base font-bold">Add Custom Target</CardTitle>
                <CardDescription>Configure a custom web URL endpoint to benchmark latency.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com or hostname"
                    value={customPingUrl}
                    onChange={(e) => setCustomPingUrl(e.target.value)}
                    className="h-9.5 text-xs bg-background/50 font-mono"
                  />
                  <Button onClick={handleAddCustomPing} size="sm" className="h-9.5 font-bold">
                    Add Target
                  </Button>
                </div>

                <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-[10px] text-muted-foreground leading-normal space-y-1.5">
                  <h5 className="font-bold uppercase tracking-wider text-primary text-[9px] flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Browser Sandbox Notes
                  </h5>
                  <p>
                    All requests are sent securely from your browser via <code>fetch</code> using <code>no-cors</code>. This timing method bypasses CORS block restrictions, though local firewall filters or proxy tools may affect latency reports.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
