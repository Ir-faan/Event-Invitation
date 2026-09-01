import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "event_invitations_admin";

type AdminEnvironment = {
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
};

function getAdminEnvironment() {
  const value = env as unknown as AdminEnvironment;
  if (!value.ADMIN_USERNAME || !value.ADMIN_PASSWORD || !value.SESSION_SECRET) {
    throw new Error("Admin credentials are not configured.");
  }
  return value;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function textToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToText(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}

async function safeEqual(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(left)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

export async function authenticateAdmin(username: string, password: string) {
  const configuration = getAdminEnvironment();
  const [usernameMatches, passwordMatches] = await Promise.all([
    safeEqual(username, configuration.ADMIN_USERNAME!),
    safeEqual(password, configuration.ADMIN_PASSWORD!),
  ]);
  return usernameMatches && passwordMatches;
}

export async function createAdminToken() {
  const configuration = getAdminEnvironment();
  const payload = textToBase64Url(JSON.stringify({ subject: "admin", expiresAt: Date.now() + 8 * 60 * 60 * 1000 }));
  return `${payload}.${await sign(payload, configuration.SESSION_SECRET!)}`;
}

export async function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  try {
    const configuration = getAdminEnvironment();
    const [payload, signature] = token.split(".");
    if (!payload || !signature || !(await safeEqual(signature, await sign(payload, configuration.SESSION_SECRET!)))) return false;
    const decoded = JSON.parse(base64UrlToText(payload)) as { subject?: string; expiresAt?: number };
    return decoded.subject === "admin" && typeof decoded.expiresAt === "number" && decoded.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function cookieValue(cookieHeader: string | null, name: string) {
  return cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export async function verifyAdminRequest(request: Request) {
  return verifyAdminToken(cookieValue(request.headers.get("cookie"), ADMIN_COOKIE));
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  if (!(await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value))) redirect("/admin/login");
}
