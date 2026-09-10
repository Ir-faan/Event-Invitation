import { NextResponse } from "next/server";
import {
  calculateInvitationPrice,
  paletteOptions,
  sectionDefinitions,
  type InvitationConfig,
} from "@/lib/invitation-designer";
import {
  createEditToken,
  hashEditToken,
  supabaseRequest,
} from "@/lib/supabase-server";

export const runtime = "edge";

function isInvitationConfig(value: unknown): value is InvitationConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<InvitationConfig>;
  return Boolean(
    config.version === 1
      && config.palette
      && paletteOptions.some((palette) => palette.id === config.palette)
      && config.contact
      && typeof config.contact.name === "string"
      && config.contact.name.trim().length >= 2
      && config.contact.name.length <= 120
      && typeof config.contact.phone === "string"
      && config.contact.phone.trim().length >= 5
      && config.contact.phone.length <= 40
      && (config.bismillah === undefined || Boolean(
        config.bismillah
          && typeof config.bismillah.enabled === "boolean"
      ))
      && config.opening
      && ["none", "envelope", "curtain"].includes(config.opening.type)
      && config.hero
      && ["basic", "interactive"].includes(config.hero.type)
      && ["preset", "upload"].includes(config.hero.photoSource)
      && Array.isArray(config.sections)
      && config.sections.length > 0
      && config.sections.length <= 40
      && config.sections.every((section) => Boolean(
        section
          && typeof section.id === "string"
          && section.id.length <= 100
          && Object.hasOwn(sectionDefinitions, section.type)
          && typeof section.included === "boolean"
          && typeof section.title === "string"
          && section.title.length <= 200
          && section.fields
          && typeof section.fields === "object"
          && Array.isArray(section.images)
          && section.images.length <= 8
          && (section.items === undefined || (
            Array.isArray(section.items)
            && section.items.length <= 100
            && section.items.every((item) => Boolean(
              item
                && typeof item === "object"
                && !Array.isArray(item)
                && Object.keys(item).length <= 20
                && Object.values(item).every((entry) => typeof entry === "string" && entry.length <= 5_000),
            ))
          )),
      )),
  );
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    if (!validId(id) || !token || token.length < 32) {
      return NextResponse.json({ error: "The saved draft details are incomplete." }, { status: 400 });
    }

    const tokenHash = await hashEditToken(token);
    const params = new URLSearchParams({
      select: "id,config,total_price,status,updated_at",
      id: `eq.${id}`,
      edit_token_hash: `eq.${tokenHash}`,
      limit: "1",
    });
    const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`);
    const rows = (await response.json()) as Array<Record<string, unknown>>;
    if (!rows[0]) return NextResponse.json({ error: "This saved draft could not be found." }, { status: 404 });
    return NextResponse.json({ invitation: rows[0] });
  } catch (error) {
    console.error("Unable to load invitation draft", error);
    return NextResponse.json({ error: "Your saved draft is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { id?: unknown; editToken?: unknown; config?: unknown };
    if (!isInvitationConfig(body.config)) {
      return NextResponse.json({ error: "Please check the invitation details and try again." }, { status: 400 });
    }

    const serialized = JSON.stringify(body.config);
    if (serialized.length > 750_000) {
      return NextResponse.json({ error: "This design is too large to save." }, { status: 413 });
    }

    const price = calculateInvitationPrice(body.config);
    const now = new Date().toISOString();

    if ((body.id || body.editToken) && !(validId(body.id) && typeof body.editToken === "string" && body.editToken.length >= 32)) {
      return NextResponse.json({ error: "The saved draft details are incomplete." }, { status: 400 });
    }

    if (validId(body.id) && typeof body.editToken === "string" && body.editToken.length >= 32) {
      const tokenHash = await hashEditToken(body.editToken);
      const params = new URLSearchParams({ id: `eq.${body.id}`, edit_token_hash: `eq.${tokenHash}` });
      const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({ config: body.config, total_price: price.total, updated_at: now }),
      });
      const rows = (await response.json()) as Array<{ id: string; updated_at: string }>;
      if (!rows[0]) return NextResponse.json({ error: "This draft could not be updated." }, { status: 404 });
      return NextResponse.json({ id: rows[0].id, editToken: body.editToken, totalPrice: price.total, updatedAt: rows[0].updated_at });
    }

    const id = crypto.randomUUID();
    const editToken = createEditToken();
    const editTokenHash = await hashEditToken(editToken);
    const response = await supabaseRequest("/rest/v1/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        id,
        edit_token_hash: editTokenHash,
        config: body.config,
        total_price: price.total,
        status: "draft",
        created_at: now,
        updated_at: now,
      }),
    });
    const rows = (await response.json()) as Array<{ id: string; updated_at: string }>;
    return NextResponse.json({ id, editToken, totalPrice: price.total, updatedAt: rows[0]?.updated_at ?? now }, { status: 201 });
  } catch (error) {
    console.error("Unable to save invitation draft", error);
    return NextResponse.json({ error: "We could not save your design just now. Your choices are still on this screen, so you can try again." }, { status: 503 });
  }
}
