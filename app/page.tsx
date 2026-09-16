import { LandingExperienceRefresh } from "@/components/landing-experience-refresh";
import { getInvitationExampleCards } from "@/lib/invitation-examples";

export default function Home() {
  return <LandingExperienceRefresh exampleCards={getInvitationExampleCards()} />;
}
