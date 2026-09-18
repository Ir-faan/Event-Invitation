import { createSection, normalizeInvitationConfig, type InvitationConfig } from "@/lib/invitation-designer";
import { sanitizeInvitationCustomSections } from "@/lib/custom-sections";
import { safeImageUrl, safeHttpsUrl } from "@/lib/safe-url";

/** Explicit guest DTO: never serialize customer contact data or unknown keys in
 * React's HTML/RSC payload, even when they are not visibly rendered. */
export function publicInvitationConfig(input: InvitationConfig): InvitationConfig {
  const config = sanitizeInvitationCustomSections(normalizeInvitationConfig(input));
  const hero = config.hero;
  return {
    version: 1,
    palette: config.palette,
    contact: { name: "", phone: "" },
    bismillah: { enabled: config.bismillah.enabled },
    opening: { type: config.opening.type, asset: config.opening.asset, initials: config.opening.initials },
    hero: {
      type: hero.type, photoSource: hero.photoSource, presetIndex: hero.presetIndex,
      uploadedUrl: safeImageUrl(hero.uploadedUrl) || "", date: hero.date,
      firstName: hero.firstName, secondName: hero.secondName, eyebrow: hero.eyebrow, message: hero.message,
    },
    sections: config.sections.map((section) => {
      const allowedFields = new Set([...Object.keys(createSection(section.type).fields), "tables", "items", "name", "date", "time", "venue", "address", "mapUrl"]);
      const fields = Object.fromEntries(Object.entries(section.fields).filter(([key]) => allowedFields.has(key)));
      if (fields.mapUrl) fields.mapUrl = safeHttpsUrl(fields.mapUrl) || "";
      return {
        id: section.id, type: section.type, included: section.included, title: section.title, fields,
        images: section.images.map(safeImageUrl).filter((url): url is string => Boolean(url)),
        items: section.items?.map((item) => Object.fromEntries(Object.entries(item).filter(([key]) =>
          ["title", "description", "date", "time", "name", "venue", "address", "mapUrl", "table", "families", "details", "note"].includes(key))
          .map(([key, value]) => [key, key === "mapUrl" ? safeHttpsUrl(value) || "" : value]))),
      };
    }),
  };
}
