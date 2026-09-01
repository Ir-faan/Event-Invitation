import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { createRandomId } from "@/lib/invitations/ids";
import { invitationSubmissionSchema } from "@/lib/invitations/schema";

export async function POST(request: Request) {
  try {
    const parsed = invitationSubmissionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Please check the highlighted invitation details.", fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const value = parsed.data;
    const invitation = {
      id: crypto.randomUUID(),
      requestCode: `EI-${createRandomId(8).toUpperCase()}`,
      publicId: createRandomId(12),
      templateSlug: value.templateSlug,
      customerName: value.customerName,
      phone: value.phone,
      email: value.email || null,
      personOneName: value.personOneName,
      personTwoName: value.personTwoName,
      intro: value.intro,
      message: value.message,
      eventDate: value.eventDate,
      eventTime: value.eventTime,
      venue: value.venue,
      address: value.address,
      primaryColor: value.primaryColor,
      secondaryColor: value.secondaryColor,
      accentColor: value.accentColor,
      status: "submitted" as const,
    };

    await getDb().insert(invitations).values(invitation);
    return Response.json({ requestCode: invitation.requestCode }, { status: 201 });
  } catch (error) {
    console.error("Invitation submission failed", error);
    return Response.json({ error: "We could not save your invitation. Please try again." }, { status: 500 });
  }
}
