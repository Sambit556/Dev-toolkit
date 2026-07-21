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
