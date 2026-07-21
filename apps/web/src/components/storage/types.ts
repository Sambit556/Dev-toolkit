// Mirrors the backend's FilePreviewResult union (storage.service.ts getFilePreview) —
// keep in sync if that shape changes.
export type FilePreviewData =
  | { kind: 'media'; previewUrl: string; mimeType: string; name: string; size: number }
  | { kind: 'text'; content: string; mimeType: string; name: string; size: number }
  | { kind: 'unsupported'; mimeType: string; name: string; size: number; reason?: string };
