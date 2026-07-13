export interface IcoImage {
  width: number;
  height: number;
  pngData: Uint8Array;
}

/**
 * Builds a multi-resolution .ico container from PNG-encoded images.
 * Modern Windows/browsers support PNG-compressed ICO entries (since Vista),
 * so no BMP re-encoding is needed — just the ICONDIR header + directory
 * entries pointing at the raw PNG bytes.
 */
export function buildIco(images: IcoImage[]): Blob {
  const HEADER_SIZE = 6;
  const ENTRY_SIZE = 16;
  const dataOffset = HEADER_SIZE + ENTRY_SIZE * images.length;
  const totalSize = dataOffset + images.reduce((sum, img) => sum + img.pngData.length, 0);

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: 1 = icon
  view.setUint16(4, images.length, true); // image count

  let entryOffset = HEADER_SIZE;
  let dataCursor = dataOffset;

  for (const img of images) {
    const dim = (n: number) => (n >= 256 ? 0 : n); // 0 means 256 in ICO format
    bytes[entryOffset] = dim(img.width);
    bytes[entryOffset + 1] = dim(img.height);
    bytes[entryOffset + 2] = 0; // color palette count (0 = no palette)
    bytes[entryOffset + 3] = 0; // reserved
    view.setUint16(entryOffset + 4, 1, true); // color planes
    view.setUint16(entryOffset + 6, 32, true); // bits per pixel
    view.setUint32(entryOffset + 8, img.pngData.length, true); // image data size
    view.setUint32(entryOffset + 12, dataCursor, true); // offset into file

    bytes.set(img.pngData, dataCursor);
    dataCursor += img.pngData.length;
    entryOffset += ENTRY_SIZE;
  }

  return new Blob([bytes], { type: 'image/x-icon' });
}
