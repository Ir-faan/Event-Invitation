import { notFound } from "next/navigation";
import { InvitationEditor } from "@/components/invitation-editor";
import { getTemplate, templates } from "@/lib/invitations/templates";

export function generateStaticParams() {
  return templates.map((template) => ({ slug: template.slug }));
}

export default async function CreateInvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = getTemplate(slug);
  if (!template) notFound();
  return <InvitationEditor template={template} />;
}
