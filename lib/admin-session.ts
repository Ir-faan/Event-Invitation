import { supabaseRequest } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const accessCookieName = "paperless_sb_access";
export const refreshCookieName = "paperless_sb_refresh";
const refreshCookieAge = 7 * 24 * 60 * 60;
const userIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AuthTokens = { access_token: string; refresh_token: string; expires_in: number };
type AdminSession = { authorized: boolean; tokens?: AuthTokens };

export function authIsConfigured() {
  return Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY) && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function authEnvironment() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Admin login is not configured. Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { url, anonKey };
}

async function authRequest(path: string, init: RequestInit = {}) {
  const { url, anonKey } = authEnvironment();
  const headers = new Headers(init.headers);
  headers.set("apikey", anonKey);
  return fetch(url + "/auth/v1" + path, { ...init, headers, cache: "no-store" });
}

function parseTokens(value: unknown): AuthTokens | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Partial<AuthTokens>;
  if (typeof data.access_token !== "string" || !data.access_token || data.access_token.length > 4096
    || typeof data.refresh_token !== "string" || !data.refresh_token || data.refresh_token.length > 4096
    || typeof data.expires_in !== "number" || !Number.isFinite(data.expires_in) || data.expires_in < 1) return null;
  return { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in };
}

async function verifiedUserId(accessToken: string): Promise<string | null> {
  const response = await authRequest("/user", { headers: { Authorization: "Bearer " + accessToken } });
  if (response.status === 400 || response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error("Supabase Auth is temporarily unavailable.");
  const user = await response.json() as { id?: unknown };
  return typeof user.id === "string" && userIdPattern.test(user.id) ? user.id : null;
}

async function isDashboardAdmin(userId: string) {
  const params = new URLSearchParams({ select: "user_id", user_id: "eq." + userId, limit: "1" });
  // The service-role key stays on the server. No client or ordinary Auth user can read this allowlist.
  const response = await supabaseRequest("/rest/v1/dashboard_admins?" + params, { cache: "no-store" });
  const rows = await response.json() as Array<{ user_id: string }>;
  return rows.some((row) => row.user_id === userId);
}

async function isAuthorized(accessToken: string) {
  const userId = await verifiedUserId(accessToken);
  return Boolean(userId && await isDashboardAdmin(userId));
}

export async function loginWithSupabase(email: string, password: string): Promise<AuthTokens | null> {
  const response = await authRequest("/token?grant_type=password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 429) return null;
  if (!response.ok) throw new Error("Supabase Auth is temporarily unavailable.");
  const tokens = parseTokens(await response.json());
  return tokens && await isAuthorized(tokens.access_token) ? tokens : null;
}

export async function getAdminSession(accessToken?: string, refreshToken?: string): Promise<AdminSession> {
  if (accessToken && accessToken.length <= 4096 && await isAuthorized(accessToken)) return { authorized: true };
  if (!refreshToken || refreshToken.length > 4096) return { authorized: false };
  const response = await authRequest("/token?grant_type=refresh_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (response.status === 400 || response.status === 401 || response.status === 403) return { authorized: false };
  if (!response.ok) throw new Error("Supabase Auth is temporarily unavailable.");
  const tokens = parseTokens(await response.json());
  return tokens && await isAuthorized(tokens.access_token) ? { authorized: true, tokens } : { authorized: false };
}

export function setAdminCookies(response: NextResponse, request: Request, tokens: AuthTokens) {
  const options = {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict" as const,
    path: "/",
  };
  response.cookies.set(accessCookieName, tokens.access_token, { ...options, maxAge: Math.min(tokens.expires_in, 86400) });
  response.cookies.set(refreshCookieName, tokens.refresh_token, { ...options, maxAge: refreshCookieAge });
  return response;
}

export function clearAdminCookies(response: NextResponse, request: Request) {
  const options = { httpOnly: true, secure: new URL(request.url).protocol === "https:", sameSite: "strict" as const, path: "/", maxAge: 0 };
  response.cookies.set(accessCookieName, "", options);
  response.cookies.set(refreshCookieName, "", options);
  return response;
}

export async function revokeAdminSession(accessToken?: string, refreshToken?: string) {
  if (!authIsConfigured()) return;
  try {
    let token = accessToken;
    if ((!token || !await verifiedUserId(token)) && refreshToken) {
      const response = await authRequest("/token?grant_type=refresh_token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      token = response.ok ? parseTokens(await response.json())?.access_token : undefined;
    }
    if (token) await authRequest("/logout?scope=local", {
      method: "POST", headers: { Authorization: "Bearer " + token },
    });
  } catch {
    // Clearing both HttpOnly cookies still signs this browser out if Auth is temporarily offline.
  }
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
