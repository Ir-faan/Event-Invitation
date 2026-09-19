import { LandingPage } from "@/components/landing/landing-page";
import { getInvitationExampleCards } from "@/lib/invitation-examples";

export default function Home() {
  return <LandingPage exampleCards={getInvitationExampleCards()} />;
}
