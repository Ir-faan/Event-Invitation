import type { Metadata } from "next";
import { InvitationDashboard } from "@/components/invitation-dashboard";
import { DesignerMobileEnhancements } from "@/components/designer-mobile-enhancements";
import "@/app/design-invitation/design-invitation.css";
import "@/app/design-invitation/mobile-ui-modifications.css";
import "@/app/design-invitation/designer-gradient-accents.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "Invitation orders — Paperless Invites",
  description: "Private invitation order review and publishing dashboard.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <><DesignerMobileEnhancements /><InvitationDashboard /></>;
}
