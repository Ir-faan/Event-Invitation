import { getHeroImage, openingAssets, type InvitationConfig } from "@/lib/invitation-designer";

/** A static, publicly reachable frame; social crawlers cannot run the opening animation. */
export function invitationPreviewImage(config: InvitationConfig, origin: string): string {
  const assets = config.opening.type === "none" ? [] : openingAssets[config.opening.type];
  const firstFrame = assets.find((item) => item.id === config.opening.asset)?.urls[config.palette]
    ?? assets[0]?.urls[config.palette]
    ?? getHeroImage(config);
  return new URL(firstFrame, origin).href;
}
