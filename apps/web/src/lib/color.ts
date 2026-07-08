export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface CMYK {
  c: number;
  m: number;
  y: number;
  k: number;
}

// 1. HEX conversions
export function hexToRgb(hex: string): RGB | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length !== 3 && clean.length !== 6 && clean.length !== 8) return null;

  let r = 0, g = 0, b = 0, a = 1;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
    if (clean.length === 8) {
      a = Math.round((parseInt(clean.substring(6, 8), 16) / 255) * 100) / 100;
    }
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;

  return { r, g, b, a };
}

export function rgbToHex(rgb: RGB): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb.r)));
  const g = Math.max(0, Math.min(255, Math.round(rgb.g)));
  const b = Math.max(0, Math.min(255, Math.round(rgb.b)));
  
  const parts = [
    r.toString(16).padStart(2, '0'),
    g.toString(16).padStart(2, '0'),
    b.toString(16).padStart(2, '0'),
  ];

  if (rgb.a !== undefined && rgb.a !== 1) {
    const alphaHex = Math.max(0, Math.min(255, Math.round(rgb.a * 255)))
      .toString(16)
      .padStart(2, '0');
    parts.push(alphaHex);
  }

  return '#' + parts.join('').toUpperCase();
}

// 2. HSL conversions
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
    a: rgb.a,
  };
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r = l, g = l, b = l;

  if (s !== 0) {
    const hue2rgb = (p: number, q: number, t: number) => {
      let temp = t;
      if (temp < 0) temp += 1;
      if (temp > 1) temp -= 1;
      if (temp < 1 / 6) return p + (q - p) * 6 * temp;
      if (temp < 1 / 2) return q;
      if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    a: hsl.a,
  };
}

// 3. CMYK conversions
export function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);

  return { c, m, y, k: Math.round(k * 100) };
}

export function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;

  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));

  return { r, g, b };
}

// 4. HSV conversions
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;

  let h = 0;
  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// 5. WCAG Contrast Check
export function getLuminance(rgb: RGB): number {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    const val = v / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function getContrastRatio(rgb1: RGB, rgb2: RGB): number {
  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

// 6. Palettes & Harmonies
export function getColorHarmonies(hex: string): Record<string, string[]> {
  const rgb = hexToRgb(hex);
  if (!rgb) return {};

  const hsl = rgbToHsl(rgb);

  // Helper to adjust hue
  const adjustHue = (h: number, amt: number) => (h + amt + 360) % 360;

  // Harmonized sets:
  return {
    complementary: [
      hex,
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, 180) })),
    ],
    analogous: [
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, -30) })),
      hex,
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, 30) })),
    ],
    triadic: [
      hex,
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, 120) })),
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, 240) })),
    ],
    splitComplementary: [
      hex,
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, 150) })),
      rgbToHex(hslToRgb({ ...hsl, h: adjustHue(hsl.h, 210) })),
    ],
    monochromatic: [
      rgbToHex(hslToRgb({ ...hsl, l: Math.max(10, hsl.l - 30) })),
      rgbToHex(hslToRgb({ ...hsl, l: Math.max(10, hsl.l - 15) })),
      hex,
      rgbToHex(hslToRgb({ ...hsl, l: Math.min(90, hsl.l + 15) })),
      rgbToHex(hslToRgb({ ...hsl, l: Math.min(90, hsl.l + 30) })),
    ],
  };
}
