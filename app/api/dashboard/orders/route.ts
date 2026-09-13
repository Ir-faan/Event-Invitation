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
import { isValidActiveUntil, makeInvitationSlug, summarizeOrder, todayInMauritius, type InvitationOrderRecord } from "@/lib/invitation-orders";
import { isInvitationConfig, validInvitationId } from "@/lib/invitation-validation";
import { createSubmissionToken, getSupabaseEnvironment, hashSubmissionToken, publicStorageUrl, supabaseRequest } from "@/lib/supabase-server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null) {
      if (!validInvitationId(id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
      await expirePastInvitations();
      const order = await getInvitationOrder(id);
      if (!order) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
      return NextResponse.json({ order: normalizeOrder(order), publicOrigin: getPublicSiteOrigin(request) });
    }
    return NextResponse.json({ orders: await listInvitationOrders(), today: todayInMauritius(), publicOrigin: getPublicSiteOrigin(request) });
  } catch (error) {
    console.error("Unable to load invitation orders", error);
    return NextResponse.json({ error: "Orders are temporarily unavailable. Please try again." }, { status: 503 });
  }
}

type StoredPhoto = { storage_path: string; public_url: string; slot: string; mime_type: string; size_bytes: number };
const photoExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown; action?: unknown };
    if (!validInvitationId(body.id) || body.action !== "duplicate") {
      return NextResponse.json({ error: "Choose a valid order to duplicate." }, { status: 400 });
    }
    const original = await getInvitationOrder(body.id);
    if (!original) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
    if (original.status !== "pending") {
      return NextResponse.json({ error: "Only orders needing your review can be duplicated." }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const mediaParams = new URLSearchParams({ select: "storage_path,public_url,slot,mime_type,size_bytes", invitation_id: `eq.${original.id}` });
    const mediaResponse = await supabaseRequest(`/rest/v1/invitation_media?${mediaParams.toString()}`, { cache: "no-store" });
    const media = (await mediaResponse.json()) as StoredPhoto[];
    const { bucket } = getSupabaseEnvironment();
    const copiedPaths: string[] = [];
    const copiedMedia: StoredPhoto[] = [];
    const copiedUrls = new Map<string, string>();
    let inserted = false;

    try {
      for (const photo of media) {
        const extension = photoExtensions[photo.mime_type];
        if (!extension || !photo.storage_path.startsWith(`${original.id}/`)) throw new Error("The source order has an invalid photo record.");
        const download = await fetch(publicStorageUrl(photo.storage_path), { cache: "no-store" });
        if (!download.ok) throw new Error("An uploaded photo on the original order could not be read.");
        const bytes = await download.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) throw new Error("An uploaded photo on the original order is invalid.");
        const storagePath = `${id}/${crypto.randomUUID()}.${extension}`;
        const encodedPath = storagePath.split("/").map(encodeURIComponent).join("/");
        await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`, {
          method: "POST",
          headers: { "Content-Type": photo.mime_type, "x-upsert": "false" },
          body: bytes,
        });
        copiedPaths.push(storagePath);
        const url = publicStorageUrl(storagePath);
        copiedUrls.set(photo.public_url, url);
        copiedUrls.set(publicStorageUrl(photo.storage_path), url);
        copiedMedia.push({ ...photo, storage_path: storagePath, public_url: url, size_bytes: bytes.byteLength });
      }

      const replacePhotoUrl = (url: string) => {
        const mapped = copiedUrls.get(url);
        if (mapped) return mapped;
        // A storage-backed photo must never remain shared between the two orders.
        if (url.includes("/storage/v1/object/") && url.includes(`/${original.id}/`)) {
          throw new Error("A photo on the original order has no storage record to duplicate.");
        }
        return url;
      };
      const config = {
        ...original.config,
        hero: { ...original.config.hero, uploadedUrl: replacePhotoUrl(original.config.hero.uploadedUrl) },
        sections: original.config.sections.map((section) => ({
          ...section,
          images: section.images.map(replacePhotoUrl),
        })),
      };
      // The status may have changed while photos were being copied.
      if ((await getInvitationOrder(original.id))?.status !== "pending") {
        throw new Error("This order was moved out of review while its copy was being prepared.");
      }
      const slug = await uniqueDuplicateSlug(original, id);
      const response = await supabaseRequest("/rest/v1/invitations?select=id,status,slug,active_until,total_price,created_at,deployed_at,inactive_at,config", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          id, slug, config, total_price: original.total_price, status: "pending",
          edit_token_hash: await hashSubmissionToken(createSubmissionToken()),
          created_at: new Date().toISOString(),
        }),
      });
      inserted = true;
      const rows = (await response.json()) as InvitationOrderRecord[];
      if (!rows[0]) throw new Error("Supabase did not return the duplicated order.");

      if (copiedMedia.length) {
        await supabaseRequest("/rest/v1/invitation_media", {
          method: "POST",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(copiedMedia.map((photo) => ({ ...photo, invitation_id: id }))),
        });
      }
      return NextResponse.json({ order: normalizeOrder(rows[0]) }, { status: 201 });
    } catch (error) {
      if (inserted) {
        try {
          const params = new URLSearchParams({ id: `eq.${id}` });
          await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
        } catch (cleanupError) {
          console.error("Duplicated order could not be rolled back; its photos were retained", cleanupError);
          throw new Error("The copy was interrupted after creating a new order. Please check your orders before retrying.");
        }
      }
      if (copiedPaths.length) {
        try {
          await supabaseRequest(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prefixes: copiedPaths }),
          });
        } catch (cleanupError) {
          console.error("Unused photos from an unsuccessful duplicate could not be removed", cleanupError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Unable to duplicate invitation order", error);
    return NextResponse.json({ error: error instanceof Error && error.message.startsWith("The copy was interrupted") ? error.message : "The order could not be duplicated. Please try again." }, { status: 503 });
  }
}

async function uniqueDuplicateSlug(original: InvitationOrderRecord, id: string) {
  const originalPath = original.slug || makeInvitationSlug(original.config);
  const base = `${originalPath.slice(0, 80).replace(/-+$/, "")}-copy`;
  for (let suffix = 1; suffix <= 100; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    if (await invitationSlugIsAvailable(candidate, id)) return candidate;
  }
  return `${base}-${id.slice(0, 8)}`;
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

    if (body.action === "prepare-link") {
      const order = existing.slug ? existing : await patchOrder(existing.id, { slug: await createUniqueInvitationSlug(existing) });
      return NextResponse.json({ order: normalizeOrder(order), publicUrl: `${getPublicSiteOrigin(request)}/${order.slug}` });
    }

    if (body.action === "save") {
      if (existing.status === "active") return NextResponse.json({ error: "Use Update live invitation to apply edits to a live order." }, { status: 409 });
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      const config = normalizeInvitationConfig(body.config);
      const requestedPrice = adminPrice(body.totalPrice);
      if (requestedPrice === null) return NextResponse.json({ error: "Enter a valid order price." }, { status: 400 });
      const totalPrice = requestedPrice ?? calculateInvitationPrice(config).total;
      const slugResult = await requestedSlug(body.slug, existing.id);
      if (slugResult.error) return NextResponse.json({ error: slugResult.error }, { status: slugResult.status });
      const values: Record<string, unknown> = { config, total_price: totalPrice };
      if (slugResult.provided) {
        values.slug = slugResult.value;
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

function isOrderAction(value: unknown): value is "save" | "deploy" | "deactivate" | "review" | "prepare-link" {
  return value === "save" || value === "deploy" || value === "deactivate" || value === "review" || value === "prepare-link";
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
