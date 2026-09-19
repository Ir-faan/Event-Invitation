import { requireAdminPage } from "@/lib/admin-guard";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import { PublishedInvitation } from "@/components/invitation/invitation-preview";
import { normalizeInvitationConfig } from "@/lib/invitation-designer";
import { getInvitationOrder } from "@/lib/invitation-orders-server";
import { validInvitationId } from "@/lib/invitation-validation";
import { sanitizeInvitationCustomSections } from "@/lib/custom-sections";
import "@/app/design-invitation/invitation.css";
import "@/app/[slug]/published-invitation.css";
import "../../preview.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Private invitation preview — Paperless Invites", robots: { index: false, follow: false } };

export default async function AdminOrderPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!validInvitationId(id)) notFound();
  const order = await getInvitationOrder(id).catch(() => {
    console.error("Unable to load private invitation preview");
    return null;
  });
  if (!order) notFound();

  return (
    <div className="admin-private-preview">
      <header className="admin-private-preview-bar">
        <div><LockKeyhole aria-hidden="true" /><span><strong>Private preview</strong><small>{order.status === "active" ? "This order is currently live" : "Guests cannot access this invitation until it is deployed"}</small></span></div>
        <Link href="/dashboard"><ArrowLeft aria-hidden="true" /> Back to orders</Link>
      </header>
      <PublishedInvitation config={sanitizeInvitationCustomSections(normalizeInvitationConfig(order.config))} privatePreview />
    </div>
  );
}
