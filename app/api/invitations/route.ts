import { NextResponse } from "next/server";
import {
  calculateInvitationPrice,
} from "@/lib/invitation-designer";
import { isInvitationConfig, validInvitationId } from "@/lib/invitation-validation";
import {
  createEditToken,
  hashEditToken,
  supabaseRequest,
} from "@/lib/supabase-server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const token = url.searchParams.get("token");
    if (!validInvitationId(id) || !token || token.length < 32) {
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

    if ((body.id || body.editToken) && !(validInvitationId(body.id) && typeof body.editToken === "string" && body.editToken.length >= 32)) {
      return NextResponse.json({ error: "The saved draft details are incomplete." }, { status: 400 });
    }

    if (validInvitationId(body.id) && typeof body.editToken === "string" && body.editToken.length >= 32) {
      const tokenHash = await hashEditToken(body.editToken);
      const params = new URLSearchParams({ id: `eq.${body.id}`, edit_token_hash: `eq.${tokenHash}` });
      const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          config: body.config,
          total_price: price.total,
          status: "pending",
          active_until: null,
          inactive_at: null,
          updated_at: now,
        }),
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
        status: "pending",
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
