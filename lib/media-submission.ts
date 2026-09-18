import { getSupabaseEnvironment, publicStorageUrl } from "@/lib/supabase-server";
import { mediaPathBelongsToOrder, privateMediaFolder } from "@/lib/private-media-path";
import { validInvitationId } from "@/lib/invitation-validation";
import { safeImageUrl } from "@/lib/safe-url";
import type { InvitationConfig } from "@/lib/invitation-designer";

export type UploadedPhoto = { url: string; path: string; slot: string; mimeType: string; sizeBytes: number; receipt: string };
export type UploadCapability = { id: string; slug: string; folder: string; slots: string[]; expires: number };

const maxAge = 30 * 60 * 1000;
const slotPattern = /^[a-z0-9:_-]{1,120}$/i;
const mimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function encode(value: string) {
  return btoa(unescape(encodeURIComponent(value))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string) {
  return decodeURIComponent(escape(atob(value.replace(/-/g, "+").replace(/_/g, "/"))));
}

async function signingKey() {
  const key = new TextEncoder().encode(`paperless-media-v1:${getSupabaseEnvironment().serviceRoleKey}`);
  return crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function sign(kind: "upload" | "receipt", value: object) {
  const payload = encode(JSON.stringify(value));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), new TextEncoder().encode(`${kind}.${payload}`));
  return `${payload}.${encode(String.fromCharCode(...new Uint8Array(signature)))}`;
}

async function verify<T>(kind: "upload" | "receipt", token: unknown): Promise<T | null> {
  if (typeof token !== "string" || token.length > 7000 || !/^[\w-]+\.[\w-]+$/.test(token)) return null;
  try {
    const [payload, mac] = token.split(".");
    const signature = Uint8Array.from(decode(mac), (char) => char.charCodeAt(0));
    if (!(await crypto.subtle.verify("HMAC", await signingKey(), signature, new TextEncoder().encode(`${kind}.${payload}`)))) return null;
    return JSON.parse(decode(payload)) as T;
  } catch { return null; }
}

export function validSlot(slot: unknown): slot is string { return typeof slot === "string" && slotPattern.test(slot); }

export async function issueUploadCapability(capability: Omit<UploadCapability, "expires">) {
  return sign("upload", { ...capability, expires: Date.now() + maxAge });
}

export async function verifyUploadCapability(token: unknown, id: unknown): Promise<UploadCapability | null> {
  const value = await verify<UploadCapability>("upload", token);
  if (!value || !validInvitationId(id) || value.id !== id || typeof value.folder !== "string" || value.folder.includes("/")
    || typeof value.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)
    || !(value.folder === await privateMediaFolder(id) || value.folder.startsWith(`${value.slug}-${id}-`))
    || !Array.isArray(value.slots) || value.slots.length > 32 || !value.slots.every(validSlot)
    || !Number.isFinite(value.expires) || value.expires < Date.now() || value.expires > Date.now() + maxAge) return null;
  return value;
}

export async function issuePhotoReceipt(photo: Omit<UploadedPhoto, "receipt" | "url"> & { id: string }) {
  return sign("receipt", { ...photo, expires: Date.now() + maxAge });
}

export async function verifyPhotos(id: string, input: unknown, capability?: UploadCapability): Promise<UploadedPhoto[] | null> {
  if (!Array.isArray(input) || input.length > 32) return null;
  const seen = new Set<string>();
  const slots = new Set<string>();
  const verified: UploadedPhoto[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const photo = item as Partial<UploadedPhoto>;
    if (typeof photo.receipt !== "string" || typeof photo.path !== "string" || typeof photo.url !== "string"
      || !validSlot(photo.slot) || !mimeTypes.has(photo.mimeType ?? "") || !Number.isInteger(photo.sizeBytes)
      || Number(photo.sizeBytes) < 1 || Number(photo.sizeBytes) > 5 * 1024 * 1024
      || slots.has(photo.slot) || seen.has(photo.path) || photo.url !== publicStorageUrl(photo.path)
      || !(capability ? photo.path.startsWith(`${capability.folder}/`) : await mediaPathBelongsToOrder(photo.path, id))
      || (capability && !capability.slots.includes(photo.slot))) return null;
    const signed = await verify<{ id: string; path: string; slot: string; mimeType: string; sizeBytes: number; expires: number }>("receipt", photo.receipt);
    if (!signed || signed.id !== id || signed.path !== photo.path || signed.slot !== photo.slot
      || signed.mimeType !== photo.mimeType || signed.sizeBytes !== photo.sizeBytes
      || signed.expires < Date.now() || signed.expires > Date.now() + maxAge) return null;
    seen.add(photo.path);
    slots.add(photo.slot);
    verified.push(photo as UploadedPhoto);
  }
  return verified;
}

export function photosMatchConfig(config: InvitationConfig, photos: UploadedPhoto[], requireAll: boolean) {
  const publicPrefix = `${getSupabaseEnvironment().url}/storage/v1/object/public/`;
  const images = [config.hero.uploadedUrl, ...config.sections.flatMap((section) => section.images)].filter(Boolean);
  if (images.some((url) => !safeImageUrl(url))) return false;
  if (requireAll && images.some((url) => !url.startsWith("/images/") && !url.startsWith(publicPrefix))) return false;
  const referenced = images.filter((url) => url.startsWith(publicPrefix));
  const provided = new Set(photos.map((photo) => photo.url));
  return photos.every((photo) => referenced.includes(photo.url)) && (!requireAll || referenced.every((url) => provided.has(url)));
}

export function mediaRows(photos: UploadedPhoto[]) {
  return photos.map((photo) => ({ storage_path: photo.path, public_url: photo.url, slot: photo.slot, mime_type: photo.mimeType, size_bytes: photo.sizeBytes }));
}
