import type { Metadata } from "next";
import { InvitationDashboard } from "@/components/invitation-dashboard";
import "@/app/design-invitation/design-invitation.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Invitation orders — Paperless Invites",
  description: "Private invitation order review and publishing dashboard.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <InvitationDashboard />;
}
