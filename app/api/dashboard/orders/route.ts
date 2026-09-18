import { withAdmin } from "@/lib/admin-guard";
import { readJson, RequestError, requestErrorResponse } from "@/lib/request-security";
import { privateMediaFolder, mediaPathBelongsToOrder, storePhoto } from "@/lib/photo-storage";
import { tryMediaCleanup } from "@/lib/media-cleanup";
import { privateDigest } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { calculateInvitationPrice, normalizeInvitationConfig, type InvitationConfig } from "@/lib/invitation-designer";
import { sanitizeInvitationCustomSections } from "@/lib/custom-sections";
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
import { mediaRows, photosMatchConfig, verifyPhotos, type UploadedPhoto } from "@/lib/media-submission";
import { getSupabaseEnvironment, publicStorageUrl, supabaseRequest, SupabaseError } from "@/lib/supabase-server";

export const runtime = "edge";

export const GET = withAdmin(async (request: Request) => {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null) {
      if (!validInvitationId(id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
      await expirePastInvitations();
      const order = await getInvitationOrder(id);
      if (!order) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
      return NextResponse.json({ order: normalizeOrder(order), publicOrigin: getPublicSiteOrigin(request) });
    }
    return NextResponse.json({ ...await listInvitationOrders(new URL(request.url).searchParams), today: todayInMauritius(), publicOrigin: getPublicSiteOrigin(request) });
  } catch (error) {
    if (requestErrorResponse(error)) return requestErrorResponse(error)!;
    if (error instanceof SupabaseError && (error.status === 409 || error.code === "23505" || error.code === "PT409")) return NextResponse.json({ error: "This order or link changed. Reload the order and try again." }, { status: 409 });
    console.error("Unable to load invitation orders");
    return NextResponse.json({ error: "Orders are temporarily unavailable. Please try again." }, { status: 503 });
  }
});

type StoredPhoto = { storage_path: string; public_url: string; slot: string; mime_type: string; size_bytes: number };
const photoExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const POST = withAdmin(async (request: Request) => {
  try {
    const body = (await readJson(request)) as { id?: unknown; action?: unknown };
    if (!validInvitationId(body.id) || body.action !== "duplicate") {
      return NextResponse.json({ error: "Choose a valid order to duplicate." }, { status: 400 });
    }
    const original = await getInvitationOrder(body.id);
    if (!original) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
    if (original.status !== "pending") {
      return NextResponse.json({ error: "Only orders needing your review can be duplicated." }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const slug = await uniqueDuplicateSlug(original, id);
    const mediaFolder = await privateMediaFolder(id);
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
        if (!extension || !await mediaPathBelongsToOrder(photo.storage_path, original.id)) throw new Error("The source order has an invalid photo record.");
        const download = await fetch(publicStorageUrl(photo.storage_path), { cache: "no-store" });
        if (!download.ok) throw new Error("An uploaded photo on the original order could not be read.");
        const bytes = await download.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > 5 * 1024 * 1024) throw new Error("An uploaded photo on the original order is invalid.");
        const stored = await storePhoto(new File([bytes], `photo.${extension}`, { type: photo.mime_type }), id, photo.slot, mediaFolder);
        const storagePath = stored.path;
        copiedPaths.push(storagePath);
        const url = publicStorageUrl(storagePath);
        copiedUrls.set(photo.public_url, url);
        copiedUrls.set(publicStorageUrl(photo.storage_path), url);
        copiedMedia.push({ ...photo, storage_path: storagePath, public_url: url, size_bytes: stored.sizeBytes });
      }

      const replacePhotoUrl = (url: string) => {
        const mapped = copiedUrls.get(url);
        if (mapped) return mapped;
        // A storage-backed photo must never remain shared between the two orders.
        if (url.startsWith(publicStorageUrl(""))) {
          throw new Error("A photo on the original order has no storage record to duplicate.");
        }
        return url;
      };
      const originalConfig = normalizeAndSanitizeConfig(original.config);
      const config = {
        ...originalConfig,
        hero: { ...originalConfig.hero, uploadedUrl: replacePhotoUrl(originalConfig.hero.uploadedUrl) },
        sections: originalConfig.sections.map((section) => ({
          ...section,
          images: section.images.map(replacePhotoUrl),
          fields: section.type === "custom" ? Object.fromEntries(Object.entries(section.fields).map(([key, value]) =>
            [key, ["html", "css"].includes(key) ? [...copiedUrls].reduce((source, [from, to]) => source.replaceAll(from, to), value) : value])) : section.fields,
        })),
      };
      // The status may have changed while photos were being copied.
      const current = await getInvitationOrder(original.id);
      if (current?.status !== "pending" || current.revision !== original.revision) {
        throw new Error("This order was moved out of review while its copy was being prepared.");
      }
      const response = await supabaseRequest("/rest/v1/rpc/create_invitation_with_media", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          p_id: id, p_slug: slug, p_config: config, p_total_price: original.total_price,
          p_media: copiedMedia.map((photo) => ({ storage_path: photo.storage_path, public_url: photo.public_url, slot: photo.slot, mime_type: photo.mime_type, size_bytes: photo.size_bytes })),
        }),
      });
      inserted = true;
      const rows = (await response.json()) as InvitationOrderRecord[];
      if (!rows[0]) throw new Error("Supabase did not return the duplicated order.");
      return NextResponse.json({ order: normalizeOrder(rows[0]) }, { status: 201 });
    } catch (error) {
      if (inserted || await getInvitationOrder(id)) {
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
    if (requestErrorResponse(error)) return requestErrorResponse(error)!;
    if (error instanceof SupabaseError && (error.status === 409 || error.code === "23505" || error.code === "PT409")) return NextResponse.json({ error: "This order or link changed. Reload the order and try again." }, { status: 409 });
    console.error("Unable to duplicate invitation order");
    return NextResponse.json({ error: error instanceof Error && error.message.startsWith("The copy was interrupted") ? error.message : "The order could not be duplicated. Please try again." }, { status: 503 });
  }
});

async function uniqueDuplicateSlug(original: InvitationOrderRecord, id: string) {
  const base = makeInvitationSlug(original.config).slice(0, 52).replace(/-+$/, "");
  return `${base}-copy-${(await privateDigest(`public-link:${id}`)).slice(0, 32)}`;
}

export const PATCH = withAdmin(async (request: Request) => {
  try {
    const body = (await readJson(request)) as {
      id?: unknown;
      action?: unknown;
      config?: unknown;
      activeUntil?: unknown;
      totalPrice?: unknown;
      slug?: unknown;
      media?: unknown;
      revision?: unknown;
    };
    if (!validInvitationId(body.id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
    if (!isOrderAction(body.action)) return NextResponse.json({ error: "Choose a valid order action." }, { status: 400 });
    if (body.config !== undefined && JSON.stringify(body.config).length > 750_000) {
      return NextResponse.json({ error: "This design is too large to save." }, { status: 413 });
    }

    const existing = await getInvitationOrder(body.id);
    if (!existing) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });
    if (!Number.isSafeInteger(body.revision) || Number(body.revision) < 1 || body.revision !== existing.revision) throw new RequestError("This order changed in another tab. Reload it before saving.", 409);
    const photos = body.media === undefined ? [] : await verifyPhotos(existing.id, body.media);
    if (!photos) return NextResponse.json({ error: "The uploaded photo receipts are invalid." }, { status: 400 });
    if (photos.length && body.action !== "save" && body.action !== "deploy") {
      return NextResponse.json({ error: "Photos can only be attached while saving an order." }, { status: 400 });
    }

    if (body.action === "prepare-link") {
      const order = existing.slug ? existing : await patchOrder(existing.id, existing.revision, { slug: await createUniqueInvitationSlug(existing) });
      return NextResponse.json({ order: normalizeOrder(order), publicUrl: `${getPublicSiteOrigin(request)}/${order.slug}` });
    }

    if (body.action === "save") {
      if (existing.status === "active") return NextResponse.json({ error: "Use Update live invitation to apply edits to a live order." }, { status: 409 });
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      const config = normalizeAndSanitizeConfig(body.config);
      if (!photosMatchConfig(config, photos, false)) return NextResponse.json({ error: "The edited design is missing an uploaded photo." }, { status: 400 });
      const requestedPrice = adminPrice(body.totalPrice);
      if (requestedPrice === null) return NextResponse.json({ error: "Enter a valid order price." }, { status: 400 });
      const totalPrice = requestedPrice ?? calculateInvitationPrice(config).total;
      const slugResult = await requestedSlug(body.slug, existing.id);
      if (slugResult.error) return NextResponse.json({ error: slugResult.error }, { status: slugResult.status });
      const values: Record<string, unknown> = { config, total_price: totalPrice };
      if (slugResult.provided) {
        values.slug = slugResult.value;
      }
      const order = await patchOrder(existing.id, existing.revision, values, photos);
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (body.action === "deactivate") {
      const order = await patchOrder(existing.id, existing.revision, {
        status: "inactive",
        inactive_at: new Date().toISOString(),
      });
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (body.action === "review") {
      const order = await patchOrder(existing.id, existing.revision, {
        status: "pending",
        active_until: null,
        inactive_at: null,
      });
      return NextResponse.json({ order: normalizeOrder(order) });
    }

    if (!isValidActiveUntil(body.activeUntil)) {
      return NextResponse.json({ error: `Choose an active-until date on or after ${todayInMauritius()}.` }, { status: 400 });
    }

    let config: InvitationConfig = normalizeAndSanitizeConfig(existing.config);
    let totalPrice = existing.total_price;
    const requestedPrice = adminPrice(body.totalPrice);
    if (requestedPrice === null) return NextResponse.json({ error: "Enter a valid order price." }, { status: 400 });
    if (body.config !== undefined) {
      if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check the edited invitation values." }, { status: 400 });
      config = normalizeAndSanitizeConfig(body.config);
      totalPrice = requestedPrice ?? calculateInvitationPrice(config).total;
    }
    if (!photosMatchConfig(config, photos, false)) return NextResponse.json({ error: "The edited design is missing an uploaded photo." }, { status: 400 });
    if (requestedPrice !== undefined) totalPrice = requestedPrice;
    const withCurrentValues = { ...existing, config };
    const slugResult = await requestedSlug(body.slug, existing.id);
    if (slugResult.error) return NextResponse.json({ error: slugResult.error }, { status: slugResult.status });
    const slug = slugResult.provided
      ? slugResult.value || await createUniqueInvitationSlug(withCurrentValues)
      : existing.slug || await createUniqueInvitationSlug(withCurrentValues);
    const order = await patchOrder(existing.id, existing.revision, {
      config,
      total_price: totalPrice,
      status: "active",
      slug,
      active_until: body.activeUntil,
      deployed_at: existing.status === "active" && existing.deployed_at ? existing.deployed_at : new Date().toISOString(),
      inactive_at: null,
    }, photos);
    return NextResponse.json({
      order: normalizeOrder(order),
      publicUrl: `${getPublicSiteOrigin(request)}/${slug}`,
    });
  } catch (error) {
    if (requestErrorResponse(error)) return requestErrorResponse(error)!;
    if (error instanceof SupabaseError && (error.status === 409 || error.code === "23505" || error.code === "PT409")) return NextResponse.json({ error: "This order or link changed. Reload the order and try again." }, { status: 409 });
    console.error("Unable to update invitation order");
    return NextResponse.json({ error: "The order could not be updated. Please try again." }, { status: 503 });
  }
});

export const DELETE = withAdmin(async (request: Request) => {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!validInvitationId(id)) return NextResponse.json({ error: "The order number is invalid." }, { status: 400 });
    const existing = await getInvitationOrder(id);
    if (!existing) return NextResponse.json({ error: "This order could not be found." }, { status: 404 });

    const revision = Number(new URL(request.url).searchParams.get("revision"));
    if (!Number.isSafeInteger(revision) || revision < 1) throw new RequestError("Reload this order before deleting it.", 409);
    await supabaseRequest("/rest/v1/rpc/delete_invitation_version", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p_id: id, p_revision: revision }),
    });
    await tryMediaCleanup();

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    if (requestErrorResponse(error)) return requestErrorResponse(error)!;
    if (error instanceof SupabaseError && (error.status === 409 || error.code === "23505" || error.code === "PT409")) return NextResponse.json({ error: "This order or link changed. Reload the order and try again." }, { status: 409 });
    console.error("Unable to delete invitation order");
    return NextResponse.json({ error: "The order could not be deleted. Please try again." }, { status: 503 });
  }
});

function isOrderAction(value: unknown): value is "save" | "deploy" | "deactivate" | "review" | "prepare-link" {
  return value === "save" || value === "deploy" || value === "deactivate" || value === "review" || value === "prepare-link";
}

function normalizeOrder(order: InvitationOrderRecord) {
  const normalized = { ...order, config: normalizeAndSanitizeConfig(order.config) };
  return { ...normalized, summary: summarizeOrder(normalized) };
}

function normalizeAndSanitizeConfig(config: InvitationConfig) {
  return sanitizeInvitationCustomSections(normalizeInvitationConfig(config));
}

async function patchOrder(id: string, revision: number, values: Record<string, unknown>, photos: UploadedPhoto[] = []) {
  const response = await supabaseRequest("/rest/v1/rpc/save_invitation_version", {
    method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ p_id: id, p_revision: revision, p_values: values, p_media: mediaRows(photos) }), cache: "no-store",
  });
  const rows = await response.json() as InvitationOrderRecord[];
  if (!rows[0]) throw new Error("The update was not confirmed.");
  await tryMediaCleanup();
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
  if (["api", "dashboard", "login", "design-invitation", "examples", "templates", "invitation"].includes(slug)) {
    return { value: null, provided: true, error: "That invitation link is reserved. Choose another one.", status: 400 };
  }
  if (!(await invitationSlugIsAvailable(slug, orderId))) {
    return { value: null, provided: true, error: "That invitation link is already in use.", status: 409 };
  }
  return { value: slug, provided: true, status: 200 };
}
