const DISPOSABLE_DOMAINS = [
  'yopmail.com', 'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'dispostable.com', 'getairmail.com', 'trashmail.com', 'sharklasers.com',
  'guerrillamailblock.com', 'guerrillamail.net', 'guerrillamail.org', 'temp-mail.ru', 'temp-mail.cc',
];

const COUNTRY_CALLING_CODES: Record<string, { country: string; code: string }> = {
  '1': { country: 'United States / Canada', code: 'US' }, '7': { country: 'Russia / Kazakhstan', code: 'RU' },
  '20': { country: 'Egypt', code: 'EG' }, '27': { country: 'South Africa', code: 'ZA' },
  '30': { country: 'Greece', code: 'GR' }, '31': { country: 'Netherlands', code: 'NL' },
  '32': { country: 'Belgium', code: 'BE' }, '33': { country: 'France', code: 'FR' },
  '34': { country: 'Spain', code: 'ES' }, '36': { country: 'Hungary', code: 'HU' },
  '39': { country: 'Italy', code: 'IT' }, '40': { country: 'Romania', code: 'RO' },
  '41': { country: 'Switzerland', code: 'CH' }, '43': { country: 'Austria', code: 'AT' },
  '44': { country: 'United Kingdom', code: 'GB' }, '45': { country: 'Denmark', code: 'DK' },
  '46': { country: 'Sweden', code: 'SE' }, '47': { country: 'Norway', code: 'NO' },
  '48': { country: 'Poland', code: 'PL' }, '49': { country: 'Germany', code: 'DE' },
  '51': { country: 'Peru', code: 'PE' }, '52': { country: 'Mexico', code: 'MX' },
  '54': { country: 'Argentina', code: 'AR' }, '55': { country: 'Brazil', code: 'BR' },
  '56': { country: 'Chile', code: 'CL' }, '57': { country: 'Colombia', code: 'CO' },
  '58': { country: 'Venezuela', code: 'VE' }, '60': { country: 'Malaysia', code: 'MY' },
  '61': { country: 'Australia', code: 'AU' }, '62': { country: 'Indonesia', code: 'ID' },
  '63': { country: 'Philippines', code: 'PH' }, '64': { country: 'New Zealand', code: 'NZ' },
  '65': { country: 'Singapore', code: 'SG' }, '66': { country: 'Thailand', code: 'TH' },
  '81': { country: 'Japan', code: 'JP' }, '82': { country: 'South Korea', code: 'KR' },
  '84': { country: 'Vietnam', code: 'VN' }, '86': { country: 'China', code: 'CN' },
  '90': { country: 'Turkey', code: 'TR' }, '91': { country: 'India', code: 'IN' },
  '92': { country: 'Pakistan', code: 'PK' }, '93': { country: 'Afghanistan', code: 'AF' },
  '94': { country: 'Sri Lanka', code: 'LK' }, '95': { country: 'Myanmar', code: 'MM' },
  '98': { country: 'Iran', code: 'IR' }, '351': { country: 'Portugal', code: 'PT' },
  '352': { country: 'Luxembourg', code: 'LU' }, '353': { country: 'Ireland', code: 'IE' },
  '354': { country: 'Iceland', code: 'IS' }, '358': { country: 'Finland', code: 'FI' },
  '380': { country: 'Ukraine', code: 'UA' }, '971': { country: 'United Arab Emirates', code: 'AE' },
  '972': { country: 'Israel', code: 'IL' }, '974': { country: 'Qatar', code: 'QA' },
  '977': { country: 'Nepal', code: 'NP' },
};

export async function lookupIpGeolocation(ip: string) {
  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('ipapi.co failed');
    const data = await res.json();
    if (data.error) throw new Error(data.reason || 'ipapi.co failed');
    return {
      ip: data.ip, version: data.version, city: data.city, region: data.region,
      countryName: data.country_name, countryCode: data.country_code, postal: data.postal,
      latitude: data.latitude, longitude: data.longitude, timezone: data.timezone,
      org: data.org, asn: data.asn, source: 'ipapi.co',
    };
  } catch {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('IP geolocation lookup failed (all providers unavailable)');
    const data = await res.json();
    if (data.success === false) throw new Error(data.message || 'Invalid IP address');
    return {
      ip: data.ip, version: data.type, city: data.city, region: data.region,
      countryName: data.country, countryCode: data.country_code, postal: data.postal_code || data.postal,
      latitude: data.latitude, longitude: data.longitude, timezone: data.timezone?.id,
      org: data.connection?.org || data.connection?.isp,
      asn: data.connection?.asn ? `AS${data.connection.asn}` : undefined,
      source: 'ipwho.is',
    };
  }
}

export function validateEmailOrPhone(input: string) {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidFormat = emailRegex.test(trimmed);
    const parts = trimmed.split('@');
    const localPart = parts[0];
    const domain = (parts[1] || '').toLowerCase();
    const isDisposable = DISPOSABLE_DOMAINS.includes(domain);
    return {
      type: 'email' as const,
      isValid: isValidFormat && !isDisposable,
      localPart, domain, isValidFormat, isDisposable,
    };
  }

  const cleaned = trimmed.replace(/[\s()\-.]/g, '');
  const hasPlus = cleaned.startsWith('+');
  const numericPart = cleaned.replace(/^\+/, '');
  const isNumeric = /^\d+$/.test(numericPart);
  const lengthValid = numericPart.length >= 7 && numericPart.length <= 15;

  let matchedCountry = 'Unknown';
  let matchedCode = 'N/A';
  let callingCode = '';
  if (isNumeric) {
    const sortedCodes = Object.keys(COUNTRY_CALLING_CODES).sort((a, b) => b.length - a.length);
    for (const code of sortedCodes) {
      if (numericPart.startsWith(code)) {
        matchedCountry = COUNTRY_CALLING_CODES[code].country;
        matchedCode = COUNTRY_CALLING_CODES[code].code;
        callingCode = `+${code}`;
        break;
      }
    }
  }
  const isValid = isNumeric && lengthValid && (hasPlus || callingCode !== '');
  return {
    type: 'phone' as const, isValid, cleaned, isNumeric, lengthValid,
    matchedCountry, matchedCountryCode: matchedCode, callingCode: callingCode || null,
  };
}

export function parseUrl(urlStr: string) {
  const parsed = new URL(urlStr);
  const params: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => { params[key] = value; });
  return {
    protocol: parsed.protocol, hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80'),
    pathname: parsed.pathname, hash: parsed.hash, queryParams: params,
  };
}
