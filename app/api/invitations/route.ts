import { NextResponse } from "next/server";
import { calculateInvitationPrice } from "@/lib/invitation-designer";
import { privateMediaFolder } from "@/lib/photo-storage";
import { readJson, requestErrorResponse, RequestError } from "@/lib/request-security";
import { limitRequest, privateDigest } from "@/lib/rate-limit";
import { validInvitationId } from "@/lib/invitation-validation";
import { type InvitationConfig } from "@/lib/invitation-designer";
import { createUniqueInvitationSlug, getInvitationOrder } from "@/lib/invitation-orders-server";
import { issueUploadCapability, mediaRows, photosMatchConfig, validSlot, verifyPhotos, verifyUploadCapability } from "@/lib/media-submission";
import { SupabaseError, supabaseRequest } from "@/lib/supabase-server";
import { isInvitationConfig } from "@/lib/invitation-validation";
import { hasCustomSectionSource } from "@/lib/custom-sections";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    await limitRequest(request, "submission-request", 40, 900);
    const body = await readJson(request) as { id?: unknown; uploadToken?: unknown; operation?: unknown; slots?: unknown; media?: unknown; config?: unknown };

    if (body.operation === "cancel-media") {
      const capability = await verifyUploadCapability(body.uploadToken, body.id);
      if (!capability) return NextResponse.json({ error: "This photo submission has expired." }, { status: 403 });
      // A timed-out response may have committed successfully: never delete that order's photos.
      if (await getInvitationOrder(capability.id)) return NextResponse.json({ committed: true });
      const photos = await verifyPhotos(capability.id, body.media, capability);
      if (!photos) return NextResponse.json({ error: "Invalid photo receipts." }, { status: 400 });
      // Uncommitted objects are already queued durably for expiry cleanup.
      return NextResponse.json({ cancelled: true });
    }

    if (!isInvitationConfig(body.config)) return NextResponse.json({ error: "Please check your name, phone number and invitation details." }, { status: 400 });
    if (JSON.stringify(body.config).length > 750_000) {
      return NextResponse.json({ error: "This design is too large to save." }, { status: 413 });
    }
    if (hasCustomSectionSource(body.config)) {
      return NextResponse.json({ error: "Custom section HTML and CSS can only be added by an administrator." }, { status: 403 });
    }
    const price = calculateInvitationPrice(body.config);

    if (body.operation === "finalize-media") {
      const capability = await verifyUploadCapability(body.uploadToken, body.id);
      if (!capability) return NextResponse.json({ error: "The photo submission expired. Please save again." }, { status: 403 });
      const committed = await committedResult(capability.id, body.config);
      if (committed) return committed;
      const photos = await verifyPhotos(capability.id, body.media, capability);
      if (!photos || photos.length !== capability.slots.length || !capability.slots.every((slot) => photos.some((photo) => photo.slot === slot))
        || !photosMatchConfig(body.config, photos, true)) {
        return NextResponse.json({ error: "Every selected photo must finish uploading before the invitation can be saved." }, { status: 400 });
      }
      const response = await supabaseRequest("/rest/v1/rpc/create_invitation_with_media", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ p_id: capability.id, p_slug: capability.slug, p_config: body.config, p_total_price: price.total, p_media: mediaRows(photos) }),
      });
      const rows = (await response.json()) as Array<{ id: string }>;
      if (!rows[0]) throw new Error("The database did not confirm the invitation.");
      return NextResponse.json({ id: rows[0].id, totalPrice: price.total }, { status: 201 });
    }

    if (body.id !== undefined || body.uploadToken !== undefined || body.operation !== undefined || body.media !== undefined) {
      return NextResponse.json({ error: "Customers can only create new invitations." }, { status: 400 });
    }
    await limitRequest(request, "submission-start", 10, 900);
    await limitRequest(request, "submission-global", 500, 86400, "all");
    const key = request.headers.get("idempotency-key");
    if (!validInvitationId(key)) throw new RequestError("Please reload the designer before submitting.");
    const digest = await privateDigest(`submission:${key}`);
    const id = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-a${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
    const committed = await committedResult(id, body.config);
    if (committed) return committed;
    const slug = await createUniqueInvitationSlug({ id, config: body.config });
    if (body.slots !== undefined) {
      if (!Array.isArray(body.slots) || body.slots.length < 1 || body.slots.length > 32 || !body.slots.every(validSlot) || new Set(body.slots).size !== body.slots.length) {
        return NextResponse.json({ error: "Select no more than 32 photos per invitation." }, { status: 400 });
      }
      const folder = await privateMediaFolder(id);
      const uploadToken = await issueUploadCapability({ id, slug, folder, slots: body.slots });
      return NextResponse.json({ id, uploadToken, totalPrice: price.total }, { status: 201 });
    }
    if (!photosMatchConfig(body.config, [], true)) return NextResponse.json({ error: "An uploaded photo is missing from this submission." }, { status: 400 });
    const response = await supabaseRequest("/rest/v1/rpc/create_invitation_with_media", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ p_id: id, p_slug: slug, p_config: body.config, p_total_price: price.total, p_media: [] }),
    });
    const rows = (await response.json()) as Array<{ id: string }>;
    if (!rows[0]) throw new Error("The database did not confirm the invitation.");
    return NextResponse.json({ id, totalPrice: price.total }, { status: 201 });
  } catch (error) {
    const known = requestErrorResponse(error);
    if (known) return known;
    if (error instanceof SupabaseError && error.code === "23505") return NextResponse.json({ error: "This submission may already be saved. Retry once with the same design to confirm." }, { status: 409 });
    console.error("Unable to create invitation order");
    return NextResponse.json({ error: "We could not send your invitation just now. Your choices are still on this screen, so you can try again." }, { status: 503 });
  }
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

async function committedResult(id: string, config: InvitationConfig) {
  const existing = await getInvitationOrder(id);
  if (!existing) return null;
  if (canonical(existing.config) !== canonical(config)) throw new RequestError("This submission was already saved. Reload before sending a different design.", 409);
  return NextResponse.json({ id: existing.id, totalPrice: existing.total_price }, { status: 200 });
}
