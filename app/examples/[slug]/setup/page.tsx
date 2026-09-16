import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InvitationDesigner } from "@/components/invitation-designer";
import { getInvitationExample, invitationExamples } from "@/lib/invitation-examples";
import "@/app/design-invitation/design-invitation.css";
import "@/app/design-invitation/mobile-ui-modifications.css";
import "@/app/design-invitation/designer-gradient-accents.css";
import "../../examples.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return invitationExamples.map((example) => ({ slug: example.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const example = getInvitationExample(slug);
  return {
    title: example ? `${example.name} design setup — Paperless Invites` : "Example design setup — Paperless Invites",
    description: example ? `View the exact read-only settings used to create the ${example.name} invitation.` : undefined,
  };
}

export default async function InvitationExampleSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getInvitationExample(slug);
  if (!example) notFound();

  return <InvitationDesigner exampleConfig={example.config} exampleName={example.name} exampleSlug={example.slug} />;
}
