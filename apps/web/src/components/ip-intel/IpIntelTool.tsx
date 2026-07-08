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
  Fingerprint
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/context/LocalizationContext';

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

export function IpIntelTool() {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'ip' | 'identity'>('ip');
  
  // IP states
  const [userIpInfo, setUserIpInfo] = useState<IpInfo | null>(null);
  const [lookupIp, setLookupIp] = useState('');
  const [searchResult, setSearchResult] = useState<IpInfo | null>(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Identity states
  const [inputVal, setInputVal] = useState('');
  const [validationResult, setValidationResult] = useState<any | null>(null);

  useEffect(() => {
    // Fetch current user IP on mount
    fetchUserIp();
  }, []);

  const fetchUserIp = async () => {
    setIpLoading(true);
    setIpError(null);

    // Helper: map ip-api.com response to IpInfo
    const mapIpApi = (d: any): IpInfo => ({
      ip: d.query,
      version: d.query?.includes(':') ? 'IPv6' : 'IPv4',
      city: d.city,
      region: d.regionName,
      country_name: d.country,
      country_code: d.countryCode,
      postal: d.zip,
      latitude: d.lat,
      longitude: d.lon,
      timezone: d.timezone,
      org: d.isp || d.org,
      asn: d.as,
    });

    // Helper: map ipwho.is response to IpInfo
    const mapIpWho = (d: any): IpInfo => ({
      ip: d.ip,
      version: d.type,
      city: d.city,
      region: d.region,
      country_name: d.country,
      country_code: d.country_code,
      postal: d.postal,
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone?.id,
      utc_offset: d.timezone?.utc,
      org: d.connection?.org || d.connection?.isp,
      asn: d.connection?.asn ? `AS${d.connection.asn}` : undefined,
    });

    // Chain: ip-api.com -> ipwho.is -> ipify (IP only)
    try {
      // ip-api.com: 45 req/min free, proper CORS, no key needed
      const fields = 'status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as';
      const res = await fetch(`https://ip-api.com/json/?fields=${fields}`);
      if (!res.ok) throw new Error('ip-api.com HTTP error');
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'ip-api.com failed');
      const info = mapIpApi(data);
      setUserIpInfo(info);
      setSearchResult(info);
    } catch (err: any) {
      console.warn('Primary IP API failed, trying ipwho.is...', err);
      try {
        const res = await fetch('https://ipwho.is/');
        if (!res.ok) throw new Error('ipwho.is HTTP error');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'ipwho.is error');
        const info = mapIpWho(data);
        setUserIpInfo(info);
        setSearchResult(info);
      } catch (err2: any) {
        console.warn('Secondary IP API failed, trying ipify...', err2);
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          if (!res.ok) throw new Error('ipify failed');
          const data = await res.json();
          const fallback: IpInfo = { ip: data.ip, city: 'Geodata unavailable', country_name: 'Unknown', org: 'ISP lookup offline' };
          setUserIpInfo(fallback);
          setSearchResult(fallback);
        } catch {
          setIpError('All IP discovery services are offline. Check your network.');
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

    try {
      // ip-api.com supports direct IP lookup with field selection
      const fields = 'status,message,query,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as';
      const res = await fetch(`https://ip-api.com/json/${trimmedIp}?fields=${fields}`);
      if (!res.ok) throw new Error('ip-api.com HTTP error');
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message || 'Lookup failed — verify IP format.');
      setSearchResult({
        ip: data.query,
        version: data.query?.includes(':') ? 'IPv6' : 'IPv4',
        city: data.city,
        region: data.regionName,
        country_name: data.country,
        country_code: data.countryCode,
        postal: data.zip,
        latitude: data.lat,
        longitude: data.lon,
        timezone: data.timezone,
        org: data.isp || data.org,
        asn: data.as,
      });
    } catch (err: any) {
      console.warn('Primary lookup failed, trying ipwho.is...', err);
      try {
        const res = await fetch(`https://ipwho.is/${trimmedIp}`);
        if (!res.ok) throw new Error('ipwho.is failed');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Invalid IP address.');
        setSearchResult({
          ip: data.ip,
          version: data.type,
          city: data.city,
          region: data.region,
          country_name: data.country,
          country_code: data.country_code,
          postal: data.postal,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone?.id,
          utc_offset: data.timezone?.utc,
          org: data.connection?.org || data.connection?.isp,
          asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
        });
      } catch (err2: any) {
        setIpError(err2.message || 'Lookup failed. Verify target IP format.');
        setSearchResult(null);
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
      </div>

      {activeTab === 'ip' ? (
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
      ) : (
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
    </div>
  );
}
