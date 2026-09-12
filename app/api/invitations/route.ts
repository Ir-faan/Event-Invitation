import { NextResponse } from "next/server";
import {
  calculateInvitationPrice,
} from "@/lib/invitation-designer";
import { isInvitationConfig, validInvitationId } from "@/lib/invitation-validation";
import {
  createSubmissionToken,
  hashSubmissionToken,
  supabaseRequest,
} from "@/lib/supabase-server";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: unknown;
      uploadToken?: unknown;
      operation?: unknown;
      expectsMedia?: unknown;
      config?: unknown;
    };
    if (!isInvitationConfig(body.config)) {
      return NextResponse.json({ error: "Please check the invitation details and try again." }, { status: 400 });
    }

    const serialized = JSON.stringify(body.config);
    if (serialized.length > 750_000) {
      return NextResponse.json({ error: "This design is too large to save." }, { status: 413 });
    }

    const price = calculateInvitationPrice(body.config);
    const now = new Date().toISOString();

    if ((body.id !== undefined || body.uploadToken !== undefined || body.operation !== undefined) && body.operation !== "finalize-media") {
      return NextResponse.json({ error: "Customers can only create a new invitation order." }, { status: 400 });
    }

    if (body.operation === "finalize-media") {
      if (!validInvitationId(body.id) || typeof body.uploadToken !== "string" || body.uploadToken.length < 32) {
        return NextResponse.json({ error: "The photo submission details are incomplete." }, { status: 400 });
      }
      const tokenHash = await hashSubmissionToken(body.uploadToken);
      const params = new URLSearchParams({ id: `eq.${body.id}`, edit_token_hash: `eq.${tokenHash}` });
      const sealedTokenHash = await hashSubmissionToken(createSubmissionToken());
      const response = await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          config: body.config,
          total_price: price.total,
          edit_token_hash: sealedTokenHash,
        }),
      });
      const rows = (await response.json()) as Array<{ id: string }>;
      if (!rows[0]) return NextResponse.json({ error: "This photo submission could not be completed." }, { status: 404 });
      return NextResponse.json({ id: rows[0].id, totalPrice: price.total });
    }

    const id = crypto.randomUUID();
    const uploadToken = createSubmissionToken();
    const submissionTokenHash = await hashSubmissionToken(uploadToken);
    const response = await supabaseRequest("/rest/v1/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        id,
        edit_token_hash: submissionTokenHash,
        config: body.config,
        total_price: price.total,
        status: "pending",
        created_at: now,
      }),
    });
    const rows = (await response.json()) as Array<{ id: string }>;
    if (!rows[0]) throw new Error("Supabase did not return the created invitation.");

    if (body.expectsMedia !== true) {
      const sealedTokenHash = await hashSubmissionToken(createSubmissionToken());
      const params = new URLSearchParams({ id: `eq.${id}` });
      await supabaseRequest(`/rest/v1/invitations?${params.toString()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ edit_token_hash: sealedTokenHash }),
      });
      return NextResponse.json({ id, totalPrice: price.total }, { status: 201 });
    }

    return NextResponse.json({ id, uploadToken, totalPrice: price.total }, { status: 201 });
  } catch (error) {
    console.error("Unable to create invitation order", error);
    return NextResponse.json({ error: "We could not send your invitation just now. Your choices are still on this screen, so you can try again." }, { status: 503 });
  }
}
