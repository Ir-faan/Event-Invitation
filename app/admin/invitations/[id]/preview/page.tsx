import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation-renderer";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { getTemplate, type InvitationContent } from "@/lib/invitations/templates";
import { requireAdmin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminInvitationPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [record] = await getDb().select().from(invitations).where(eq(invitations.id, id)).limit(1);
  if (!record) notFound();
  const template = getTemplate(record.templateSlug);
  if (!template) notFound();
  const content: InvitationContent = {
    personOneName: record.personOneName, personTwoName: record.personTwoName,
    intro: record.intro, message: record.message, eventDate: record.eventDate,
    eventTime: record.eventTime, venue: record.venue, address: record.address,
    primaryColor: record.primaryColor, secondaryColor: record.secondaryColor, accentColor: record.accentColor,
  };
  return <main><InvitationRenderer template={template} content={content} /></main>;
}
