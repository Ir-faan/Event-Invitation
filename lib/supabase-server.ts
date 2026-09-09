type SupabaseEnvironment = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    url,
    serviceRoleKey,
    bucket: process.env.SUPABASE_STORAGE_BUCKET || "invitation-media",
  };
}

export async function hashEditToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createEditToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseEnvironment();
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceRoleKey);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);

  const response = await fetch(`${url}${path}`, { ...init, headers });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response;
}

export async function invitationExists(id: string, token: string) {
  const hash = await hashEditToken(token);
  const params = new URLSearchParams({ select: "id", id: `eq.${id}`, edit_token_hash: `eq.${hash}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`);
  const rows = (await response.json()) as Array<{ id: string }>;
  return rows.length > 0;
}

export function publicStorageUrl(path: string) {
  const { url, bucket } = getSupabaseEnvironment();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}
