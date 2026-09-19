import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InvitationDesigner } from "@/components/designer/invitation-designer";
import { getInvitationExample, invitationExamples } from "@/lib/invitation-examples";
import "@/app/design-invitation/invitation.css";
import "@/app/design-invitation/editor.css";
import "../../examples.css";

export const dynamicParams = false;
// Setup pages carry client-module references for the full designer. Never let
// an older RSC payload outlive the content-hashed client chunks it references.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return invitationExamples.map((example) => ({ slug: example.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const example = getInvitationExample(slug);
  return {
    title: example ? `${example.name} design setup — Paperless Invites` : "Example design setup — Paperless Invites",
    description: example ? `View the exact read-only settings used to create the ${example.name} invitation.` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function InvitationExampleSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getInvitationExample(slug);
  if (!example) notFound();

  return <InvitationDesigner exampleConfig={example.config} exampleName={example.name} exampleSlug={example.slug} />;
}
