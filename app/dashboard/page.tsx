import { requireAdminPage } from "@/lib/admin-guard";
import type { Metadata } from "next";
import { InvitationDashboard } from "@/components/dashboard/invitation-dashboard";
import "@/app/design-invitation/invitation.css";
import "@/app/design-invitation/editor.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Invitation orders — Paperless Invites",
  description: "Private invitation order review and publishing dashboard.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  await requireAdminPage();
  return <InvitationDashboard />;
}
