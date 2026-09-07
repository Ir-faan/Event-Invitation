import type { Metadata } from "next";
import { CoastalReverieInvitation } from "@/components/coastal-reverie-invitation";
import { CoastalGiftSection } from "@/components/coastal-gift-section";
import { CoastalBismillah } from "@/components/coastal-bismillah";

export const metadata: Metadata = {
  title: "Salma & Sam — Coastal Reverie",
  description: "You are invited to celebrate the wedding of Salma and Sam on 17 September 2027.",
};

export default function CoastalReveriePage() {
  return (
    <>
      <CoastalReverieInvitation />
      <CoastalBismillah />
      <CoastalGiftSection />
    </>
  );
}
