type SupabaseEnvironment = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

export class SupabaseError extends Error {
  constructor(public readonly status: number, public readonly code?: string) {
    // Provider messages can contain table data, SQL details or object paths.
    super(`Supabase request failed (${status})${code ? ` [${code}]` : ""}`);
  }
}

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

export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const { url, serviceRoleKey } = getSupabaseEnvironment();
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceRoleKey);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);

  const response = await fetch(`${url}${path}`, { ...init, headers });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({})) as { code?: unknown };
    throw new SupabaseError(response.status, typeof detail.code === "string" && /^[A-Z0-9_]{1,20}$/.test(detail.code) ? detail.code : undefined);
  }
  return response;
}

export function publicStorageUrl(path: string) {
  const { url, bucket } = getSupabaseEnvironment();
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
}
