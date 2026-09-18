import { cacheForRequest } from "vinext/cache";
import { publicInvitationConfig } from "@/lib/public-invitation";
import type { InvitationConfig } from "@/lib/invitation-designer";
import { RequestError } from "@/lib/request-security";
import { privateDigest } from "@/lib/rate-limit";
import {
  makeInvitationSlug,
  todayInMauritius,
  type InvitationOrderRecord,
  type InvitationOrderSummary,
} from "@/lib/invitation-orders";
import { supabaseRequest } from "@/lib/supabase-server";

const orderFields = "id,revision,status,slug,active_until,total_price,created_at,deployed_at,inactive_at,config";
export const defaultPublicSiteOrigin = "https://www.paperless-invites.com";

export function getConfiguredPublicSiteOrigin() {
  if (!process.env.PUBLIC_SITE_URL) return null;
  try {
    const configured = new URL(process.env.PUBLIC_SITE_URL);
    return configured.protocol === "https:" && !configured.username && !configured.password ? configured.origin : null;
  } catch { return null; }
}

export async function expirePastInvitations() {
  const params = new URLSearchParams({ status: "eq.active", active_until: `lt.${todayInMauritius()}` });
  await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: "inactive", inactive_at: new Date().toISOString() }),
    cache: "no-store",
  });
}

export async function listInvitationOrders(search: URLSearchParams) {
  const page = Number(search.get("page") || 1);
  const size = Number(search.get("size") || 10);
  const query = (search.get("search") || "").trim();
  const statuses = (search.get("statuses") ?? "pending").split(",").filter(Boolean);
  const sort = search.get("sort") || "created_at";
  const direction = search.get("direction") || "desc";
  if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000 || ![10, 25, 50].includes(size) || query.length > 120
    || statuses.some((status) => !["pending", "active", "inactive"].includes(status))
    || !["coupleName", "customerName", "eventDate", "created_at", "total_price", "status"].includes(sort)
    || !["asc", "desc"].includes(direction)) throw new RequestError("Invalid order filters.");
  await expirePastInvitations();
  const response = await supabaseRequest("/rest/v1/rpc/list_invitation_orders", {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ p_page: page, p_size: size, p_query: query, p_statuses: statuses, p_sort: sort, p_direction: direction }),
  });
  return await response.json() as { orders: InvitationOrderSummary[]; total: number; totalValue: number; counts: { pending: number; active: number; inactive: number } };
}

export async function getInvitationOrder(id: string): Promise<InvitationOrderRecord | null> {
  const params = new URLSearchParams({ select: orderFields, id: `eq.${id}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
  const rows = (await response.json()) as InvitationOrderRecord[];
  return rows[0] ?? null;
}

type PublicInvitation = { slug: string; config: InvitationConfig };
const requestLookups = cacheForRequest(() => new Map<string, Promise<PublicInvitation | null>>());
// Each new request checks status/expiry/revision: undeploy is immediate across
// Worker isolates. Only the immutable revision's public content is cached.
const publicSnapshots = new Map<string, { config: InvitationConfig; expires: number }>();
export function getPublicInvitationBySlug(slug: string): Promise<PublicInvitation | null> {
  const lookups = requestLookups();
  if (!lookups.has(slug)) lookups.set(slug, loadPublicInvitation(slug));
  return lookups.get(slug)!;
}
async function loadPublicInvitation(slug: string): Promise<PublicInvitation | null> {
  if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const params = new URLSearchParams({ select: "id,revision", slug: `eq.${slug}`, status: "eq.active", active_until: `gte.${todayInMauritius()}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params}`, { cache: "no-store" });
  const row = (await response.json() as Array<{ id: string; revision: number }>)[0];
  if (!row) return null;
  const key = `${row.id}:${row.revision}`;
  const cached = publicSnapshots.get(key);
  if (cached && cached.expires > Date.now()) return { slug, config: cached.config };
  params.set("select", "config");
  params.set("revision", `eq.${row.revision}`);
  const detail = await supabaseRequest(`/rest/v1/invitations?${params}`, { cache: "no-store" });
  const value = (await detail.json() as Array<{ config: InvitationConfig }>)[0];
  if (!value) return null;
  const config = publicInvitationConfig(value.config);
  if (publicSnapshots.size >= 16) publicSnapshots.delete(publicSnapshots.keys().next().value!);
  publicSnapshots.set(key, { config, expires: Date.now() + 5 * 60_000 });
  return { slug, config };
}

export async function createUniqueInvitationSlug(order: Pick<InvitationOrderRecord, "id" | "config">) {
  // Preserve saved links. Newly allocated links contain 128 bits unrelated to
  // names or the internal order UUID, and need no check-then-insert query.
  const base = makeInvitationSlug(order.config).slice(0, 52).replace(/-+$/, "");
  return `${base}-${(await privateDigest(`public-link:${order.id}`)).slice(0, 32)}`;
}

export async function invitationSlugIsAvailable(slug: string, orderId: string) {
  const params = new URLSearchParams({ select: "id", slug: `eq.${slug}`, id: `neq.${orderId}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
  const matches = (await response.json()) as Array<{ id: string }>;
  return matches.length === 0;
}

export function getPublicSiteOrigin(request?: Request) {
  const configured = getConfiguredPublicSiteOrigin();
  if (configured) return configured;
  const requestUrl = new URL(request?.url || defaultPublicSiteOrigin);
  // Never put a localhost address in a link meant to be sent to a customer.
  if (requestUrl.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(requestUrl.hostname)) return defaultPublicSiteOrigin;
  return requestUrl.username || requestUrl.password ? defaultPublicSiteOrigin : requestUrl.origin;
}
