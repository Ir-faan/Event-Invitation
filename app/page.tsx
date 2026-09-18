import { LandingMainPolish } from "@/components/landing-main-polish";
import { LandingTemplateCardTilt } from "@/components/landing-template-card-tilt";
import { LandingExperienceRefresh } from "@/components/landing-experience-refresh";
import { getInvitationExampleCards } from "@/lib/invitation-examples";
import { LandingFaq } from "@/components/landing-faq";

export default function Home() {
  return (
    <>
      <LandingMainPolish />
      <LandingTemplateCardTilt />
      <LandingExperienceRefresh exampleCards={getInvitationExampleCards()} />
      <LandingFaq />
    </>
  );
}
