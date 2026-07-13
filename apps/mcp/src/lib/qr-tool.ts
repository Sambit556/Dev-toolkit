import QRCode from 'qrcode';

/** Generates a QR code PNG for the given text/URL. Returns base64-encoded PNG bytes. */
export async function generateQrCode(opts: {
  text: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  darkColor?: string;
  lightColor?: string;
}): Promise<string> {
  const buffer = await QRCode.toBuffer(opts.text, {
    width: opts.size ?? 256,
    margin: 2,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? 'M',
    color: { dark: opts.darkColor ?? '#000000', light: opts.lightColor ?? '#FFFFFF' },
  });
  return buffer.toString('base64');
}
