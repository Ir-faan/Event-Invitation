import { LandingExperienceRefresh } from "@/components/landing-experience-refresh";
import { getInvitationExampleCards } from "@/lib/invitation-examples";
import { LandingFaq } from "@/components/landing-faq";

export default function Home() {
  return (
    <>
      <LandingExperienceRefresh exampleCards={getInvitationExampleCards()} />
      <LandingFaq />
    </>
  );
}
