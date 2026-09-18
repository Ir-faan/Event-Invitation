import { RequestError } from "@/lib/request-security";

const maxBytes = 5 * 1024 * 1024;
const fail = () => { throw new RequestError("Please choose a valid JPG, PNG or WebP photo.", 415); };
function dimensions(width: number, height: number) {
  if (!width || !height || width > 12_000 || height > 12_000 || width * height > 40_000_000) {
    throw new RequestError("This photo has too many pixels. Please resize it before uploading.", 413);
  }
}
function join(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

// Retain only the orientation number from legacy camera JPEGs. Removing it
// without decoding would rotate older photos when an administrator duplicates
// an invitation. GPS, timestamps, thumbnails and all other EXIF fields go away.
function orientationOnly(segment: Uint8Array) {
  try {
    if (String.fromCharCode(...segment.subarray(0, 6)) !== "Exif\0\0") return null;
    const view = new DataView(segment.buffer, segment.byteOffset + 6, segment.length - 6);
    const little = view.getUint16(0) === 0x4949;
    if ((!little && view.getUint16(0) !== 0x4d4d) || view.getUint16(2, little) !== 42) return null;
    const directory = view.getUint32(4, little);
    const count = Math.min(view.getUint16(directory, little), 128);
    for (let index = 0; index < count; index++) {
      const entry = directory + 2 + index * 12;
      if (view.getUint16(entry, little) !== 0x112 || view.getUint16(entry + 2, little) !== 3 || view.getUint32(entry + 4, little) !== 1) continue;
      const orientation = view.getUint16(entry + 8, little);
      if (orientation < 1 || orientation > 8) return null;
      return new Uint8Array([255,225,0,34,69,120,105,102,0,0,77,77,0,42,0,0,0,8,0,1,1,18,0,3,0,0,0,1,0,orientation,0,0,0,0,0,0]);
    }
  } catch { /* Malformed metadata is discarded without affecting image pixels. */ }
  return null;
}

/** Structural checks + dimensions + metadata removal, independent of File.type.
 * This is not a full codec decoder; guests still decode compressed image pixels.
 */
export async function validatePhoto(file: File) {
  if (file.size > maxBytes) throw new RequestError("Each photo must be 5 MB or smaller.", 413);
  if (file.size < 12) return fail();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.subarray(start, start + length));
  let mimeType: string;
  let extension: string;
  let clean: Uint8Array;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    mimeType = "image/jpeg"; extension = "jpg";
    const parts = [bytes.subarray(0, 2)];
    let offset = 2; let hasSize = false; let hasScan = false;
    while (offset < bytes.length) {
      const start = offset;
      if (bytes[offset++] !== 0xff) return fail();
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9) { parts.push(bytes.subarray(start, offset)); break; }
      if (offset + 2 > bytes.length) return fail();
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return fail();
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (length < 8) return fail();
        dimensions(view.getUint16(offset + 5), view.getUint16(offset + 3)); hasSize = true;
      }
      const end = offset + length;
      if (marker === 0xe1) {
        const orientation = orientationOnly(bytes.subarray(offset + 2, end));
        if (orientation) parts.push(orientation);
      }
      // APP1 EXIF/XMP, APP13 IPTC, COM and unknown APP blocks are private metadata.
      if (!(marker === 0xfe || (marker >= 0xe1 && marker <= 0xef && marker !== 0xe2 && marker !== 0xee))) parts.push(bytes.subarray(start, end));
      offset = end;
      if (marker === 0xda) {
        hasScan = true;
        const scanStart = offset;
        while (offset < bytes.length - 1) {
          if (bytes[offset] === 0xff && bytes[offset + 1] !== 0x00 && !(bytes[offset + 1] >= 0xd0 && bytes[offset + 1] <= 0xd7)) break;
          offset++;
        }
        parts.push(bytes.subarray(scanStart, offset));
      }
    }
    if (!hasSize || !hasScan || bytes[offset - 2] !== 0xff || bytes[offset - 1] !== 0xd9) return fail();
    clean = join(parts);
  } else if (ascii(1, 3) === "PNG" && bytes[0] === 137 && view.getUint32(4) === 0x0d0a1a0a) {
    mimeType = "image/png"; extension = "png";
    const parts = [bytes.subarray(0, 8)];
    let offset = 8; let hasData = false; let ended = false;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset); const kind = ascii(offset + 4, 4);
      const end = offset + 12 + length;
      if (end > bytes.length || (offset === 8 && (kind !== "IHDR" || length !== 13))) return fail();
      if (kind === "IHDR") {
        if (offset !== 8 || length !== 13) return fail();
        dimensions(view.getUint32(offset + 8), view.getUint32(offset + 12));
      }
      if (kind === "IDAT") hasData = true;
      // Keep rendering/color/transparency chunks; remove EXIF/text/profiles with metadata.
      if (["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "sRGB", "gAMA", "cHRM", "iCCP"].includes(kind)) parts.push(bytes.subarray(offset, end));
      offset = end;
      if (kind === "IEND") { if (length) return fail(); ended = true; break; }
    }
    if (!hasData || !ended) return fail();
    clean = join(parts);
  } else if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP" && view.getUint32(4, true) + 8 === bytes.length) {
    mimeType = "image/webp"; extension = "webp";
    const parts = [bytes.slice(0, 12)];
    let offset = 12; let hasPixels = false;
    while (offset + 8 <= bytes.length) {
      const kind = ascii(offset, 4); const length = view.getUint32(offset + 4, true);
      const data = offset + 8; const end = data + length + (length % 2);
      if (end > bytes.length) return fail();
      if (kind === "VP8X") {
        if (length !== 10) return fail();
        const u24 = (i: number) => bytes[i] | bytes[i + 1] << 8 | bytes[i + 2] << 16;
        dimensions(u24(data + 4) + 1, u24(data + 7) + 1);
        if (bytes[data] & 2) throw new RequestError("Please use a still photo rather than an animated WebP.", 415);
        const chunk = bytes.slice(offset, end); chunk[8] &= ~(8 | 4); parts.push(chunk);
      } else if (kind === "VP8 ") {
        if (length < 10 || ascii(data + 3, 3) !== "\x9d\x01\x2a") return fail();
        dimensions(view.getUint16(data + 6, true) & 0x3fff, view.getUint16(data + 8, true) & 0x3fff);
        hasPixels = true; parts.push(bytes.subarray(offset, end));
      } else if (kind === "VP8L") {
        if (length < 5 || bytes[data] !== 0x2f) return fail();
        const bits = view.getUint32(data + 1, true);
        dimensions((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
        hasPixels = true; parts.push(bytes.subarray(offset, end));
      } else if (["ALPH", "ICCP"].includes(kind)) parts.push(bytes.subarray(offset, end));
      offset = end;
    }
    if (!hasPixels || offset !== bytes.length) return fail();
    clean = join(parts); new DataView(clean.buffer).setUint32(4, clean.length - 8, true);
  } else return fail();

  if (file.type !== mimeType) return fail();
  if (!/\.(?:jpe?g|png|webp)$/i.test(file.name)) return fail();
  const suffix = file.name.split(".").pop()!.toLowerCase();
  if (!(extension === "jpg" ? ["jpg", "jpeg"].includes(suffix) : suffix === extension)) return fail();
  return { bytes: clean, mimeType, extension };
}
