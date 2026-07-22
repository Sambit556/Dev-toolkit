import { UAParser } from 'ua-parser-js';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other';

// UAParser never actually returns 'desktop' as a device.type (it's a deprecated,
// unused value in the library itself — see ua-parser-enums.d.ts) — an *absent*
// device.type is what a normal laptop/desktop browser looks like, so that's the
// fallback here, not a fourth explicit category.
export function detectDeviceType(userAgent: string | undefined | null): DeviceType {
  if (!userAgent) return 'other';

  const { device } = UAParser(userAgent);
  if (device.type === 'mobile') return 'mobile';
  if (device.type === 'tablet') return 'tablet';
  if (!device.type) return 'desktop';
  return 'other'; // console, smarttv, wearable, embedded, xr
}

export interface MobileDeviceInfo {
  label: string;
  type: DeviceType;
}

// A human-friendly "iPhone 15 · Safari, iOS 17.4"-style label for the mobile-upload
// QR flow's connect notification and session history — best-effort from the UA
// string alone (browsers don't expose exact hardware model beyond what's in it).
export function getMobileDeviceLabel(userAgent: string | undefined | null): MobileDeviceInfo {
  const type = detectDeviceType(userAgent);
  if (!userAgent) return { label: 'Unknown device', type };

  const { device, os, browser } = UAParser(userAgent);
  const deviceName = [device.vendor, device.model].filter(Boolean).join(' ') || (os.name ? `${os.name} device` : 'Unknown device');
  const browserPart = browser.name ? `${browser.name}${browser.version ? ` ${browser.version.split('.')[0]}` : ''}` : null;
  const osPart = os.name ? `${os.name}${os.version ? ` ${os.version}` : ''}` : null;
  const suffix = [browserPart, osPart].filter(Boolean).join(', ');

  return { label: suffix ? `${deviceName} · ${suffix}` : deviceName, type };
}
