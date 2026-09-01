import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/components/invitation-renderer";
import { getDb } from "@/db";
import { invitations } from "@/db/schema";
import { getTemplate, type InvitationContent } from "@/lib/invitations/templates";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

export default async function PublishedInvitationPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const [record] = await getDb().select().from(invitations).where(and(eq(invitations.publicId, publicId), eq(invitations.status, "published"))).limit(1);
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
