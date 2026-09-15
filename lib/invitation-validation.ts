import {
  paletteOptions,
  sectionDefinitions,
  type InvitationConfig,
} from "@/lib/invitation-designer";
import {
  customSectionCssField,
  customSectionHtmlField,
  maxCustomSectionCssLength,
  maxCustomSectionHtmlLength,
} from "@/lib/custom-sections";

function validSectionField(type: string, key: string, value: unknown) {
  if (typeof value !== "string") return false;
  if (type === "custom" && key === customSectionHtmlField) return value.length <= maxCustomSectionHtmlLength;
  if (type === "custom" && key === customSectionCssField) return value.length <= maxCustomSectionCssLength;
  return value.length <= 5_000;
}

export function isInvitationConfig(value: unknown): value is InvitationConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as Partial<InvitationConfig>;
  return Boolean(
    config.version === 1
      && config.palette
      && paletteOptions.some((palette) => palette.id === config.palette)
      && config.contact
      && typeof config.contact.name === "string"
      && config.contact.name.trim().length >= 2
      && config.contact.name.length <= 120
      && typeof config.contact.phone === "string"
      && /^5\d{7}$/.test(config.contact.phone.trim())
      && (config.bismillah === undefined || Boolean(
        config.bismillah
          && typeof config.bismillah.enabled === "boolean"
      ))
      && config.opening
      && ["none", "envelope", "curtain"].includes(config.opening.type)
      && typeof config.opening.asset === "string"
      && config.opening.asset.length <= 100
      && typeof config.opening.initials === "string"
      && config.opening.initials.length <= 40
      && config.hero
      && ["basic", "interactive"].includes(config.hero.type)
      && ["preset", "upload"].includes(config.hero.photoSource)
      && Number.isInteger(config.hero.presetIndex)
      && Number(config.hero.presetIndex) >= 0
      && Number(config.hero.presetIndex) <= 20
      && typeof config.hero.uploadedUrl === "string"
      && config.hero.uploadedUrl.length <= 2_000
      && (config.hero.date === undefined || (
        typeof config.hero.date === "string"
        && config.hero.date.length <= 40
      ))
      && typeof config.hero.firstName === "string"
      && config.hero.firstName.length <= 120
      && typeof config.hero.secondName === "string"
      && config.hero.secondName.length <= 120
      && typeof config.hero.eyebrow === "string"
      && config.hero.eyebrow.length <= 300
      && typeof config.hero.message === "string"
      && config.hero.message.length <= 5_000
      && Array.isArray(config.sections)
      && config.sections.length > 0
      && config.sections.length <= 40
      && config.sections.every((section) => Boolean(
        section
          && typeof section.id === "string"
          && section.id.length <= 100
          && Object.hasOwn(sectionDefinitions, section.type)
          && typeof section.included === "boolean"
          && typeof section.title === "string"
          && section.title.length <= 200
          && section.fields
          && typeof section.fields === "object"
          && !Array.isArray(section.fields)
          && Object.entries(section.fields).every(([key, entry]) => validSectionField(section.type, key, entry))
          && Array.isArray(section.images)
          && section.images.length <= 8
          && section.images.every((image) => typeof image === "string" && image.length <= 2_000)
          && (section.items === undefined || (
            Array.isArray(section.items)
            && section.items.length <= 100
            && section.items.every((item) => Boolean(
              item
                && typeof item === "object"
                && !Array.isArray(item)
                && Object.keys(item).length <= 20
                && Object.values(item).every((entry) => typeof entry === "string" && entry.length <= 5_000),
            ))
          )),
      )),
  );
}

export function validInvitationId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
