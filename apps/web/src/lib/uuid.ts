const BASE32_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateV4(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateV1(): string {
  // 60-bit timestamp of 100ns intervals since October 15, 1582.
  const GregorianEpochOffset = BigInt('122192928000000000');
  const now = BigInt(Date.now());
  const offset100ns = BigInt(Math.floor(Math.random() * 10000));
  const time = now * BigInt(10000) + GregorianEpochOffset + offset100ns;

  const timeHex = time.toString(16).padStart(16, '0');
  const timeLow = timeHex.substring(8, 16);
  const timeMid = timeHex.substring(4, 8);
  const timeHiAndVersion = '1' + timeHex.substring(1, 4);

  const clockSeq = (Math.floor(Math.random() * 0x3fff) | 0x8000).toString(16).padStart(4, '0');

  const node = Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');

  return `${timeLow}-${timeMid}-${timeHiAndVersion}-${clockSeq}-${node}`;
}

export function generateUlid(timestamp = Date.now()): string {
  let timeStr = '';
  let time = timestamp;
  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = BASE32_ALPHABET[mod] + timeStr;
    time = Math.floor(time / 32);
  }

  let randStr = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  const bytes = new Uint8Array(16);
  if (cryptoObj) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }

  for (let i = 0; i < 16; i++) {
    randStr += BASE32_ALPHABET[bytes[i] % 32];
  }

  return timeStr + randStr;
}

export function generateNanoId(
  size = 21,
  alphabet = 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUOpqradsjhUXVWhwzI'
): string {
  let id = '';
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null;
  const bytes = new Uint8Array(size);
  if (cryptoObj) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] % alphabet.length];
  }
  return id;
}

export interface UuidV1Details {
  timestamp: string;
  node: string;
  clockSequence: string;
}

export function decodeUuidV1(uuid: string): UuidV1Details | null {
  const cleanUuid = uuid.trim().toLowerCase();
  const parts = cleanUuid.split('-');
  if (parts.length !== 5 || cleanUuid[14] !== '1') return null; // Not a v1 UUID

  try {
    const timeLow = parts[0];
    const timeMid = parts[1];
    const timeHiAndVersion = parts[2];
    const clockSequence = parts[3];
    const node = parts[4];

    // Reconstruct 60-bit hex timestamp: timeHi (3 hex chars) + timeMid + timeLow
    const timeHi = timeHiAndVersion.substring(1, 4); // Remove version '1'
    const timeHex = timeHi + timeMid + timeLow;
    const gTimestamp = BigInt(`0x${timeHex}`);

    // Convert from Gregorian 100ns units to standard Unix ms
    const GregorianEpochOffset = BigInt('122192928000000000');
    const unixMs = Number((gTimestamp - GregorianEpochOffset) / BigInt(10000));

    const formattedDate = new Date(unixMs).toISOString();

    const formattedMac = node.match(/.{1,2}/g)?.join(':') || node;

    return {
      timestamp: formattedDate,
      node: formattedMac.toUpperCase(),
      clockSequence: `0x${clockSequence}`,
    };
  } catch (e) {
    return null;
  }
}

// Convert string to bytes
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert UUID string to bytes
function uuidToBytes(uuid: string): Uint8Array {
  const clean = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Convert byte array to UUID string
function bytesToUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return (
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 12) +
    '-' +
    hex.substring(12, 16) +
    '-' +
    hex.substring(16, 20) +
    '-' +
    hex.substring(20, 32)
  );
}

export async function generateV5(namespaceUuid: string, name: string): Promise<string> {
  try {
    const nsBytes = uuidToBytes(namespaceUuid);
    const nameBytes = stringToBytes(name);
    const combinedBytes = new Uint8Array(nsBytes.length + nameBytes.length);
    combinedBytes.set(nsBytes);
    combinedBytes.set(nameBytes, nsBytes.length);

    // Compute SHA-1
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', combinedBytes);
    const hashBytes = new Uint8Array(hashBuffer);

    // Set version (5) and variant bits
    hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50; // set version 5
    hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80; // set variant RFC4122

    // Return first 16 bytes formatted as UUID
    return bytesToUuid(hashBytes.subarray(0, 16));
  } catch (e) {
    throw new Error('Invalid Namespace UUID or calculation failed');
  }
}
