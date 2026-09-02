import type { Metadata } from "next";
import { CoastalReverieInvitation } from "@/components/coastal-reverie-invitation";

export const metadata: Metadata = {
  title: "Salma & Sam — Coastal Reverie",
  description: "You are invited to celebrate the wedding of Salma and Sam on 17 September 2027.",
};

export default function CoastalReveriePage() {
  return <CoastalReverieInvitation />;
}
