import { NextResponse } from "next/server";
import { calculateInvitationPrice, normalizeInvitationConfig, type InvitationConfig } from "@/lib/invitation-designer";
import {
  createUniqueInvitationSlug,
  expirePastInvitations,
  getInvitationOrder,
  getPublicSiteOrigin,
  listInvitationOrders,
} from "@/lib/invitation-orders-server";
import { isValidActiveUntil, summarizeOrder, todayInMauritius, type InvitationOrderRecord } from "@/lib/invitation-orders";
import { isInvitationConfig, validInvitationId } from "@/lib/invitation-validation";
import { supabaseRequest } from "@/lib/supabase-server";

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
    };
    if (!validInvitationId(body.id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
    if (!isOrderAction(body.action)) return NextResponse.json({ error: "Choose a valid order action." }, { status: 400 });

    const existing = await getInvitationOrder(body.id);
    if (!existing) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });

    if (body.action === "save") {
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      const config = normalizeInvitationConfig(body.config);
      const totalPrice = calculateInvitationPrice(config).total;
      const order = await patchOrder(existing.id, { config, total_price: totalPrice });
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (body.action === "deactivate") {
      const order = await patchOrder(existing.id, {
        status: "inactive",
        inactive_at: new Date().toISOString(),
      });
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (!isValidActiveUntil(body.activeUntil)) {
      return NextResponse.json({ error: `Choose an active-until date on or after ${todayInMauritius()}.` }, { status: 400 });
    }

    let config: InvitationConfig = normalizeInvitationConfig(existing.config);
    let totalPrice = existing.total_price;
    if (body.config !== undefined) {
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      config = normalizeInvitationConfig(body.config);
      totalPrice = calculateInvitationPrice(config).total;
    }
    const withCurrentValues = { ...existing, config };
    const slug = existing.slug || await createUniqueInvitationSlug(withCurrentValues);
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

function isOrderAction(value: unknown): value is "save" | "deploy" | "deactivate" {
  return value === "save" || value === "deploy" || value === "deactivate";
}

function normalizeOrder(order: InvitationOrderRecord) {
  const normalized = { ...order, config: normalizeInvitationConfig(order.config) };
  return { ...normalized, summary: summarizeOrder(normalized) };
}

async function patchOrder(id: string, values: Record<string, unknown>) {
  const params = new URLSearchParams({ id: `eq.${id}`, select: "id,status,slug,active_until,total_price,created_at,updated_at,deployed_at,inactive_at,config" });
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
