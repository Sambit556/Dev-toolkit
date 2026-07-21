export function getFileColor(mimeType?: string): string {
  if (!mimeType) return '#64748b'; // other
  if (mimeType.startsWith('image/')) return '#8b5cf6';
  if (mimeType.startsWith('video/')) return '#3b82f6';
  if (mimeType.startsWith('audio/')) return '#f59e0b';
  if (['application/zip', 'application/x-tar', 'application/x-rar', 'application/x-7z', 'application/gzip', 'application/x-bzip2'].some(p => mimeType.startsWith(p))) return '#ef4444';
  if (mimeType.includes('excalidraw') || mimeType.includes('drawio')) return '#ec4899';
  if (mimeType.includes('pdf')) return '#dc2626';
  if (mimeType.includes('msword') || mimeType.includes('wordprocessingml')) return '#2563eb';
  if (mimeType.includes('ms-excel') || mimeType.includes('spreadsheetml')) return '#16a34a';
  if (mimeType.includes('ms-powerpoint') || mimeType.includes('presentationml')) return '#ea580c';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html') || mimeType.includes('css')) return '#14b8a6';
  if (mimeType.includes('csv')) return '#10b981';
  if (mimeType.startsWith('text/')) return '#52525b';
  return '#64748b';
}
