import {
  makeInvitationSlug,
  summarizeOrder,
  todayInMauritius,
  type InvitationOrderRecord,
  type InvitationOrderSummary,
} from "@/lib/invitation-orders";
import { supabaseRequest } from "@/lib/supabase-server";

const orderFields = "id,status,slug,active_until,total_price,created_at,deployed_at,inactive_at,config";

export async function expirePastInvitations() {
  const params = new URLSearchParams({ status: "eq.active", active_until: `lt.${todayInMauritius()}` });
  await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ status: "inactive", inactive_at: new Date().toISOString() }),
    cache: "no-store",
  });
}

export async function listInvitationOrders(): Promise<InvitationOrderSummary[]> {
  await expirePastInvitations();
  const params = new URLSearchParams({
    select: orderFields,
    order: "created_at.desc",
    limit: "250",
  });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
  const rows = (await response.json()) as InvitationOrderRecord[];
  return rows.map(summarizeOrder);
}

export async function getInvitationOrder(id: string): Promise<InvitationOrderRecord | null> {
  const params = new URLSearchParams({ select: orderFields, id: `eq.${id}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
  const rows = (await response.json()) as InvitationOrderRecord[];
  return rows[0] ?? null;
}

export async function getPublicInvitationBySlug(slug: string): Promise<InvitationOrderRecord | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const params = new URLSearchParams({ select: orderFields, slug: `eq.${slug}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
  const rows = (await response.json()) as InvitationOrderRecord[];
  const order = rows[0];
  if (!order || order.status !== "active") return null;
  if (!order.active_until || order.active_until < todayInMauritius()) {
    const update = new URLSearchParams({ id: `eq.${order.id}` });
    await supabaseRequest(`/rest/v1/invitations?${update.toString()}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ status: "inactive", inactive_at: new Date().toISOString() }),
      cache: "no-store",
    });
    return null;
  }
  return order;
}

export async function createUniqueInvitationSlug(order: InvitationOrderRecord) {
  const base = makeInvitationSlug(order.config);
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix ? `${base}-${suffix + 1}` : base;
    const params = new URLSearchParams({ select: "id", slug: `eq.${candidate}`, id: `neq.${order.id}`, limit: "1" });
    const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
    const matches = (await response.json()) as Array<{ id: string }>;
    if (!matches.length) return candidate;
  }
  return `${base}-${order.id.slice(0, 8)}`;
}

export async function invitationSlugIsAvailable(slug: string, orderId: string) {
  const params = new URLSearchParams({ select: "id", slug: `eq.${slug}`, id: `neq.${orderId}`, limit: "1" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { cache: "no-store" });
  const matches = (await response.json()) as Array<{ id: string }>;
  return matches.length === 0;
}

export function getPublicSiteOrigin(request: Request) {
  const configured = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured && /^https?:\/\//i.test(configured)) return configured;
  return new URL(request.url).origin;
}
