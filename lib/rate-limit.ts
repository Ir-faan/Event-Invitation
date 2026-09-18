import { getSupabaseEnvironment, supabaseRequest } from "@/lib/supabase-server";
import { RequestError } from "@/lib/request-security";

export async function privateDigest(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(getSupabaseEnvironment().serviceRoleKey), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Database-backed atomic counters work across Worker isolates and restarts.
 * Cloudflare replaces CF-Connecting-IP; never trust arbitrary X-Forwarded-For.
 * Other hosts must provide the same trusted ingress guarantee before production.
 */
export async function limitRequest(request: Request, scope: string, limit: number, seconds: number, identity?: string) {
  const subject = identity ?? request.headers.get("cf-connecting-ip") ?? "unknown-ingress";
  const key = await privateDigest(`rate:${scope}:${subject}`);
  const response = await supabaseRequest("/rest/v1/rpc/consume_request_limit", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ p_key: key, p_limit: limit, p_seconds: seconds }), cache: "no-store",
  });
  if (await response.json() !== true) throw new RequestError("Too many attempts. Please wait a little and try again.", 429);
}
