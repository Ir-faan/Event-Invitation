import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CircleDollarSign, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { PublishedInvitation } from "@/components/invitation-phone-preview";
import { normalizeInvitationConfig } from "@/lib/invitation-designer";
import {
  getInvitationExample,
  getInvitationExamplePrice,
  invitationExamples,
} from "@/lib/invitation-examples";
import "@/app/design-invitation/design-invitation.css";
import "@/app/[slug]/published-invitation.css";
import "../examples.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return invitationExamples.map((example) => ({ slug: example.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const example = getInvitationExample(slug);
  if (!example) return { title: "Invitation example — Paperless Invites" };
  const coupleNames = `${example.config.hero.firstName} & ${example.config.hero.secondName}`;
  return {
    title: `${example.name} — Paperless Invites example`,
    description: `Preview ${example.name}, a ${example.eventLabel.toLowerCase()} invitation for ${coupleNames}, and inspect the exact design setup.`,
  };
}

export default async function InvitationExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getInvitationExample(slug);
  if (!example) notFound();

  const config = normalizeInvitationConfig(example.config);
  const price = getInvitationExamplePrice(example);

  return (
    <div className="example-preview-page">
      <header className="example-preview-toolbar">
        <Link href="/#collection" className="example-toolbar-back"><ArrowLeft aria-hidden="true" /> All examples</Link>
        <div className="example-toolbar-identity">
          <span>{example.name}</span>
          <strong>{config.hero.firstName} &amp; {config.hero.secondName}</strong>
          <small><CircleDollarSign aria-hidden="true" /> Approx. Rs {price.toLocaleString("en-US")}</small>
        </div>
        <Link href={`/examples/${example.slug}/setup`} className="example-toolbar-setup"><SlidersHorizontal aria-hidden="true" /> <span>View Design Setup</span></Link>
      </header>
      <PublishedInvitation config={config} exampleMode />
    </div>
  );
}
