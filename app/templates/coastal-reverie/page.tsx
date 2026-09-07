import type { Metadata } from "next";
import { CoastalReverieInvitation } from "@/components/coastal-reverie-invitation";
import { CoastalGiftSection } from "@/components/coastal-gift-section";
import { CoastalBismillah } from "@/components/coastal-bismillah";
import {
  CoastalTraditionalCard,
  type TraditionalCardDetails,
} from "@/components/coastal-traditional-card";

export const metadata: Metadata = {
  title: "Salma & Sam — Coastal Reverie",
  description: "You are invited to celebrate the wedding of Salma and Sam on 17 September 2027.",
};

const traditionalCardDetails: TraditionalCardDetails = {
  familyLine: "Together with their families",
  invitationMessage: "Request the honour of your presence at the wedding celebration of",
  brideName: "Salma",
  groomName: "Sam",
  date: "Friday, 17 September 2027",
  timePrefix: "at",
  time: "4:30 PM",
  venue: "The Ravenala Attitude",
  location: "Balaclava, Mauritius",
  giftHeading: "Humble request",
  giftPreference: "No gift box please",
};

export default function CoastalReveriePage() {
  return (
    <>
      <CoastalReverieInvitation />
      <CoastalBismillah />
      <CoastalGiftSection />
      <CoastalTraditionalCard details={traditionalCardDetails} />
    </>
  );
}
