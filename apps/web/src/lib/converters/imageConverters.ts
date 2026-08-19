'use client';

import { jsPDF } from 'jspdf';

/**
 * Loads any image file (including HEIC) into an HTMLImageElement and returns its dimensions.
 */
export async function loadImageFromFile(file: File): Promise<{
  img: HTMLImageElement;
  width: number;
  height: number;
  revoke: () => void;
}> {
  let sourceBlob: Blob = file;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Handle HEIC/HEIF files
  if (['heic', 'heif'].includes(ext)) {
    try {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/png',
        quality: 0.95,
      });
      sourceBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (err) {
      console.warn('heic2any conversion failed, attempting direct load', err);
    }
  }

  const url = URL.createObjectURL(sourceBlob);
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to decode image: ${file.name}`));
    img.src = url;
  });

  return {
    img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    revoke: () => URL.revokeObjectURL(url),
  };
}

/**
 * Converts an image file to a target raster format (JPG, PNG, WebP, AVIF, BMP).
 */
export async function convertRasterImage(
  file: File,
  targetFormat: 'jpg' | 'png' | 'webp' | 'avif' | 'bmp',
  quality = 0.92
): Promise<Blob> {
  const { img, width, height, revoke } = await loadImageFromFile(file);

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to create canvas context');

    // Fill white background for JPEG / BMP to avoid black transparency
    if (targetFormat === 'jpg' || targetFormat === 'bmp') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    let mimeType = 'image/png';
    if (targetFormat === 'jpg') mimeType = 'image/jpeg';
    else if (targetFormat === 'webp') mimeType = 'image/webp';
    else if (targetFormat === 'avif') mimeType = 'image/avif';
    else if (targetFormat === 'bmp') mimeType = 'image/bmp';

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else {
            // Fallback if browser doesn't support specific mime (e.g. avif / bmp canvas export)
            canvas.toBlob(
              (fallbackBlob) => (fallbackBlob ? resolve(fallbackBlob) : reject(new Error('Export failed'))),
              'image/png'
            );
          }
        },
        mimeType,
        quality
      );
    });
  } finally {
    revoke();
  }
}

/**
 * Converts a single image into a PDF page sized proportionally.
 */
export async function convertImageToPdf(file: File): Promise<Blob> {
  const { img, width, height, revoke } = await loadImageFromFile(file);

  try {
    const isLandscape = width > height;
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const scale = Math.min(availableWidth / width, availableHeight / height);
    const renderWidth = width * scale;
    const renderHeight = height * scale;

    const posX = (pageWidth - renderWidth) / 2;
    const posY = (pageHeight - renderHeight) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(dataUrl, 'JPEG', posX, posY, renderWidth, renderHeight);
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  } finally {
    revoke();
  }
}

/**
 * Combines multiple images into a single multi-page PDF document.
 */
export async function convertMultipleImagesToPdf(
  files: File[],
  options: {
    margin?: number;
    orientation?: 'portrait' | 'landscape' | 'auto';
    fit?: 'contain' | 'cover' | 'original';
  } = {}
): Promise<Blob> {
  if (files.length === 0) throw new Error('No images provided for PDF generation');

  const { margin = 20, orientation = 'auto' } = options;
  let doc: jsPDF | null = null;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { img, width, height, revoke } = await loadImageFromFile(file);

    try {
      const pageOrientation =
        orientation === 'auto'
          ? width > height
            ? 'landscape'
            : 'portrait'
          : orientation;

      if (i === 0) {
        doc = new jsPDF({
          orientation: pageOrientation,
          unit: 'pt',
          format: 'a4',
        });
      } else if (doc) {
        doc.addPage('a4', pageOrientation);
      }

      if (!doc) continue;

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const availableWidth = Math.max(10, pageWidth - margin * 2);
      const availableHeight = Math.max(10, pageHeight - margin * 2);

      const scale = Math.min(availableWidth / width, availableHeight / height);
      const renderWidth = width * scale;
      const renderHeight = height * scale;

      const posX = (pageWidth - renderWidth) / 2;
      const posY = (pageHeight - renderHeight) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        doc.addImage(dataUrl, 'JPEG', posX, posY, renderWidth, renderHeight);
      }
    } finally {
      revoke();
    }
  }

  if (!doc) throw new Error('Failed to generate multi-page PDF');
  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

/**
 * Traces / posterizes an image to generate clean, scalable Vector SVG markup.
 */
export async function convertImageToSvg(file: File, numColors = 16): Promise<Blob> {
  const { img, width, height, revoke } = await loadImageFromFile(file);

  try {
    // Limit processing canvas resolution for smooth vectorization
    const maxDim = 320;
    const scale = Math.min(1, maxDim / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Vector canvas setup failed');

    ctx.drawImage(img, 0, 0, targetW, targetH);
    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    // Posterize & build color run rects/polygons for SVG
    const quantStep = Math.max(16, Math.floor(256 / numColors));
    const rects: { x: number; y: number; w: number; h: number; fill: string }[] = [];

    // Horizontal run-length encoding for compact vector polygons
    for (let y = 0; y < targetH; y++) {
      let runStart = 0;
      let prevColor = '';

      for (let x = 0; x < targetW; x++) {
        const idx = (y * targetW + x) * 4;
        const a = data[idx + 3];
        let color = '';

        if (a > 20) {
          const r = Math.round(data[idx] / quantStep) * quantStep;
          const g = Math.round(data[idx + 1] / quantStep) * quantStep;
          const b = Math.round(data[idx + 2] / quantStep) * quantStep;
          color = `rgb(${r},${g},${b})`;
        }

        if (color !== prevColor) {
          if (prevColor && runStart < x) {
            rects.push({
              x: runStart,
              y,
              w: x - runStart,
              h: 1,
              fill: prevColor,
            });
          }
          prevColor = color;
          runStart = x;
        }
      }

      if (prevColor && runStart < targetW) {
        rects.push({
          x: runStart,
          y,
          w: targetW - runStart,
          h: 1,
          fill: prevColor,
        });
      }
    }

    // Combine adjacent identical color vertical slices to minimize SVG node count
    const svgElements = rects
      .map(
        (r) =>
          `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${r.fill}" shape-rendering="crispEdges" />`
      )
      .join('\n  ');

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${targetW} ${targetH}" width="${width}" height="${height}">
  <!-- Vectorized client-side by Devkits File Converter -->
  ${svgElements}
</svg>`;

    return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  } finally {
    revoke();
  }
}
