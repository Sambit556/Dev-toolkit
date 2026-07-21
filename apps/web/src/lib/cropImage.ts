export interface CropPixelArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

// Renders the cropped region onto a canvas at a fixed output size (upscaling
// small source crops, downscaling large ones) so every avatar — hand-picked
// persona or user photo — comes out the same crisp square regardless of the
// original image's resolution.
export async function getCroppedImageBlob(
  imageSrc: string,
  cropPixels: CropPixelArea,
  outputSize = 512
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    image,
    cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
    0, 0, outputSize, outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to render cropped image'));
    }, 'image/png', 0.95);
  });
}

// For sources that are already a clean square (the generated persona avatars) —
// no crop UI needed, just rasterize the whole thing at a fixed output size.
export async function rasterizeImageBlob(imageSrc: string, outputSize = 512): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const size = Math.min(image.naturalWidth || image.width, image.naturalHeight || image.height);
  return getCroppedImageBlob(imageSrc, { x: 0, y: 0, width: size, height: size }, outputSize);
}
