import { NextResponse } from "next/server";
import { calculateInvitationPrice, normalizeInvitationConfig, type InvitationConfig } from "@/lib/invitation-designer";
import {
  createUniqueInvitationSlug,
  expirePastInvitations,
  getInvitationOrder,
  getPublicSiteOrigin,
  invitationSlugIsAvailable,
  listInvitationOrders,
} from "@/lib/invitation-orders-server";
import { isValidActiveUntil, summarizeOrder, todayInMauritius, type InvitationOrderRecord } from "@/lib/invitation-orders";
import { isInvitationConfig, validInvitationId } from "@/lib/invitation-validation";
import { getSupabaseEnvironment, supabaseRequest } from "@/lib/supabase-server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null) {
      if (!validInvitationId(id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
      await expirePastInvitations();
      const order = await getInvitationOrder(id);
      if (!order) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
      return NextResponse.json({ order: normalizeOrder(order) });
    }
    return NextResponse.json({ orders: await listInvitationOrders(), today: todayInMauritius() });
  } catch (error) {
    console.error("Unable to load invitation orders", error);
    return NextResponse.json({ error: "Orders are temporarily unavailable. Please try again." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: unknown;
      action?: unknown;
      config?: unknown;
      activeUntil?: unknown;
      totalPrice?: unknown;
      slug?: unknown;
    };
    if (!validInvitationId(body.id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
    if (!isOrderAction(body.action)) return NextResponse.json({ error: "Choose a valid order action." }, { status: 400 });

    const existing = await getInvitationOrder(body.id);
    if (!existing) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });

    if (body.action === "save") {
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      const config = normalizeInvitationConfig(body.config);
      const requestedPrice = adminPrice(body.totalPrice);
      if (requestedPrice === null) return NextResponse.json({ error: "Enter a valid order price." }, { status: 400 });
      const totalPrice = requestedPrice ?? calculateInvitationPrice(config).total;
      const slugResult = await requestedSlug(body.slug, existing.id);
      if (slugResult.error) return NextResponse.json({ error: slugResult.error }, { status: slugResult.status });
      const values: Record<string, unknown> = { config, total_price: totalPrice };
      if (slugResult.provided) {
        values.slug = existing.status === "active" && !slugResult.value
          ? await createUniqueInvitationSlug({ ...existing, config })
          : slugResult.value;
      }
      const order = await patchOrder(existing.id, values);
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (body.action === "deactivate") {
      const order = await patchOrder(existing.id, {
        status: "inactive",
        inactive_at: new Date().toISOString(),
      });
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (body.action === "review") {
      const order = await patchOrder(existing.id, {
        status: "pending",
        active_until: null,
        inactive_at: null,
      });
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (!isValidActiveUntil(body.activeUntil)) {
      return NextResponse.json({ error: `Choose an active-until date on or after ${todayInMauritius()}.` }, { status: 400 });
    }

    let config: InvitationConfig = normalizeInvitationConfig(existing.config);
    let totalPrice = existing.total_price;
    const requestedPrice = adminPrice(body.totalPrice);
    if (requestedPrice === null) return NextResponse.json({ error: "Enter a valid order price." }, { status: 400 });
    if (body.config !== undefined) {
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      config = normalizeInvitationConfig(body.config);
      totalPrice = requestedPrice ?? calculateInvitationPrice(config).total;
    }
    if (requestedPrice !== undefined) totalPrice = requestedPrice;
    const withCurrentValues = { ...existing, config };
    const slugResult = await requestedSlug(body.slug, existing.id);
    if (slugResult.error) return NextResponse.json({ error: slugResult.error }, { status: slugResult.status });
    const slug = slugResult.provided
      ? slugResult.value || await createUniqueInvitationSlug(withCurrentValues)
      : existing.slug || await createUniqueInvitationSlug(withCurrentValues);
    const order = await patchOrder(existing.id, {
      config,
      total_price: totalPrice,
      status: "active",
      slug,
      active_until: body.activeUntil,
      deployed_at: existing.status === "active" && existing.deployed_at ? existing.deployed_at : new Date().toISOString(),
      inactive_at: null,
    });
    return NextResponse.json({
      order: normalizeOrder(order),
      publicUrl: `${getPublicSiteOrigin(request)}/${slug}`,
    });
  } catch (error) {
    console.error("Unable to update invitation order", error);
    return NextResponse.json({ error: "The order could not be updated. Please try again." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!validInvitationId(id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
    const existing = await getInvitationOrder(id);
    if (!existing) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });

    const mediaParams = new URLSearchParams({ select: "storage_path", invitation_id: `eq.${id}` });
    const mediaResponse = await supabaseRequest(`/rest/v1/invitation_media?${mediaParams.toString()}`, { cache: "no-store" });
    const media = (await mediaResponse.json()) as Array<{ storage_path: string }>;
    const orderParams = new URLSearchParams({ id: `eq.${id}` });
    await supabaseRequest(`/rest/v1/invitations?${orderParams.toString()}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
      cache: "no-store",
    });

    if (media.length) {
      try {
        const { bucket } = getSupabaseEnvironment();
        await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: media.map((item) => item.storage_path) }),
        });
      } catch (storageError) {
        console.error("Order deleted, but its stored media could not be removed", storageError);
      }
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("Unable to delete invitation order", error);
    return NextResponse.json({ error: "The order could not be deleted. Please try again." }, { status: 503 });
  }
}

function isOrderAction(value: unknown): value is "save" | "deploy" | "deactivate" | "review" {
  return value === "save" || value === "deploy" || value === "deactivate" || value === "review";
}

function normalizeOrder(order: InvitationOrderRecord) {
  const normalized = { ...order, config: normalizeInvitationConfig(order.config) };
  return { ...normalized, summary: summarizeOrder(normalized) };
}

async function patchOrder(id: string, values: Record<string, unknown>) {
  const params = new URLSearchParams({ id: `eq.${id}`, select: "id,status,slug,active_until,total_price,created_at,deployed_at,inactive_at,config" });
  const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  const rows = (await response.json()) as InvitationOrderRecord[];
  if (!rows[0]) throw new Error("Supabase did not return the updated order.");
  return rows[0];
}

function adminPrice(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  const price = typeof value === "number" ? value : Number(value);
  return Number.isInteger(price) && price >= 0 && price <= 10_000_000 ? price : null;
}

async function requestedSlug(value: unknown, orderId: string): Promise<{
  value: string | null;
  provided: boolean;
  error?: string;
  status: number;
}> {
  if (value === undefined) return { value: null, provided: false, status: 200 };
  if (typeof value !== "string") return { value: null, provided: true, error: "Enter a valid invitation link.", status: 400 };
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  if (!slug) return { value: null, provided: true, status: 200 };
  if (["api", "dashboard", "design-invitation", "templates", "invitation"].includes(slug)) {
    return { value: null, provided: true, error: "That invitation link is reserved. Choose another one.", status: 400 };
  }
  if (!(await invitationSlugIsAvailable(slug, orderId))) {
    return { value: null, provided: true, error: "That invitation link is already in use.", status: 409 };
  }
  return { value: slug, provided: true, status: 200 };
}
