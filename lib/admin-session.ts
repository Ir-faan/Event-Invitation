export const adminCookieName = "paperless_admin_session";
const sessionDurationMs = 8 * 60 * 60 * 1000;

export function adminIsConfigured() {
  return Boolean(process.env.DASHBOARD_USERNAME && process.env.DASHBOARD_PASSWORD
    && (!process.env.DASHBOARD_SESSION_SECRET || process.env.DASHBOARD_SESSION_SECRET.length >= 32));
}

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sessionKey() {
  const secret = `paperless-session-v1:${process.env.DASHBOARD_SESSION_SECRET || process.env.DASHBOARD_PASSWORD}`;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function matchesAdminCredentials(username: string, password: string) {
  if (!adminIsConfigured()) return false;
  const expected = `${process.env.DASHBOARD_USERNAME}\n${process.env.DASHBOARD_PASSWORD}`;
  const supplied = `${username}\n${password}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(process.env.DASHBOARD_SESSION_SECRET || process.env.DASHBOARD_PASSWORD!), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expected));
  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(supplied));
}

export async function issueAdminSession() {
  if (!adminIsConfigured()) throw new Error("Admin login is not configured.");
  const payload = `v1.${Date.now() + sessionDurationMs}.${crypto.randomUUID()}`;
  const signature = await crypto.subtle.sign("HMAC", await sessionKey(), new TextEncoder().encode(payload));
  return { value: `${payload}.${base64Url(new Uint8Array(signature))}`, maxAge: sessionDurationMs / 1000 };
}

export async function verifyAdminSession(value?: string) {
  if (!adminIsConfigured() || !value || value.length > 256) return false;
  const match = /^(v1\.\d{13}\.[0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/.exec(value);
  if (!match) return false;
  const expiry = Number(match[1].split(".")[1]);
  if (!Number.isSafeInteger(expiry) || expiry < Date.now() || expiry > Date.now() + sessionDurationMs) return false;
  try {
    const signature = Uint8Array.from(atob(match[2].replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));
    return crypto.subtle.verify("HMAC", await sessionKey(), signature, new TextEncoder().encode(match[1]));
  } catch { return false; }
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
