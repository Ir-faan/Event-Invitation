export type PaletteId = "beige" | "olive" | "dusty-blue" | "burgundy" | "pink" | "lilac";
export type OpeningType = "none" | "envelope" | "curtain";
export type HeroType = "basic" | "interactive";
export type SectionType =
  | "countdown"
  | "journey"
  | "event-details"
  | "gift"
  | "special-message"
  | "seating"
  | "day-programme"
  | "glimpse"
  | "custom";

export const includedSectionTypes: SectionType[] = ["countdown", "journey", "event-details", "gift"];

export type InvitationSectionItem = Record<string, string>;

export type InvitationSection = {
  id: string;
  type: SectionType;
  included: boolean;
  title: string;
  fields: Record<string, string>;
  images: string[];
  /** Optional so orders created before repeatable items were introduced still open. */
  items?: InvitationSectionItem[];
};

export type InvitationConfig = {
  version: 1;
  palette: PaletteId;
  contact: {
    name: string;
    phone: string;
  };
  bismillah: {
    enabled: boolean;
  };
  opening: {
    type: OpeningType;
    asset: string;
    initials: string;
  };
  hero: {
    type: HeroType;
    photoSource: "preset" | "upload";
    presetIndex: number;
    uploadedUrl: string;
    date: string;
    firstName: string;
    secondName: string;
    eyebrow: string;
    message: string;
  };
  sections: InvitationSection[];
};

export const paletteOptions = [
  {
    id: "beige" as const,
    name: "Beige",
    description: "Warm ivory and champagne",
    colors: ["#f1d7b7", "#fff7e9", "#a76e35"],
    theme: { background: "#f4dfc7", surface: "#fff8ed", primary: "#7a4326", secondary: "#d9a56c", accent: "#b67937", ink: "#3c2117", muted: "#765344" },
  },
  {
    id: "olive" as const,
    name: "Olive Green",
    description: "Fresh olive and warm cream",
    colors: ["#687442", "#aab76b", "#eef0cf"],
    theme: { background: "#dfe5bd", surface: "#f8f6df", primary: "#485523", secondary: "#98aa58", accent: "#9a752d", ink: "#263014", muted: "#5b6740" },
  },
  {
    id: "dusty-blue" as const,
    name: "Dusty Blue",
    description: "Clear blue-grey and pearl",
    colors: ["#557b98", "#9dc5dc", "#edf7fb"],
    theme: { background: "#c9e1ed", surface: "#f4fbfe", primary: "#315c7c", secondary: "#82b6d1", accent: "#5e8098", ink: "#17364b", muted: "#4f7084" },
  },
  {
    id: "burgundy" as const,
    name: "Burgundy / Wine",
    description: "Rich wine and antique gold",
    colors: ["#681c38", "#b54f70", "#f2bccb"],
    theme: { background: "#e8aebf", surface: "#fff1f5", primary: "#6d1735", secondary: "#c15376", accent: "#b88a39", ink: "#3c0d20", muted: "#794156" },
  },
  {
    id: "pink" as const,
    name: "Pink",
    description: "Bright blush and rose",
    colors: ["#b94f78", "#e58eab", "#ffdbe6"],
    theme: { background: "#f4bfd0", surface: "#fff2f7", primary: "#94375e", secondary: "#df789a", accent: "#b9785b", ink: "#4d1730", muted: "#825168" },
  },
  {
    id: "lilac" as const,
    name: "Purple / Lilac",
    description: "Vivid lilac and pearl",
    colors: ["#704187", "#b77bd0", "#ead4f3"],
    theme: { background: "#dcc2ea", surface: "#faf0ff", primary: "#67357d", secondary: "#ac6ac6", accent: "#9c6b95", ink: "#351842", muted: "#6d4778" },
  },
] as const;

/**
 * Public theme tokens available to admin-authored Custom Parts. Their values
 * are always derived from the selected invitation palette below, so adding a
 * palette does not require maintaining a second set of Custom Part colours.
 */
export const invitationThemeVariableDefinitions = [
  { name: "--invitation-primary", description: "Primary colour" },
  { name: "--invitation-secondary", description: "Secondary colour" },
  { name: "--invitation-accent", description: "Accent colour" },
  { name: "--invitation-background", description: "Invitation background" },
  { name: "--invitation-background-alt", description: "Alternate background" },
  { name: "--invitation-text", description: "Main text" },
  { name: "--invitation-text-muted", description: "Muted text" },
  { name: "--invitation-border", description: "Border colour" },
  { name: "--invitation-card", description: "Card background" },
] as const;

export type InvitationThemeVariableName = (typeof invitationThemeVariableDefinitions)[number]["name"];

type HeroPreset = { id: string; name: string; url: string; objectPosition: string; zoom: number; hidden?: boolean };

/** Bump this value whenever the invitation artwork changes. */
export const invitationAssetVersion = "20260911-1";

function invitationAssetUrl(path: string) {
  return `/invitation/${path}?v=${invitationAssetVersion}`;
}

function matchedHeroPresets(palette: PaletteId, signatureUrl: string): HeroPreset[] {
  return [
    { id: `${palette}-full`, name: "Signature scene", url: signatureUrl, objectPosition: "center center", zoom: 1 },
    // Preserve the legacy index so existing saved invitations keep the same following presets.
    { id: `${palette}-close`, name: "Closer crop", url: signatureUrl, objectPosition: "center 68%", zoom: 1.14, hidden: true },
    { id: `${palette}-ballroom`, name: "Grand ballroom", url: invitationAssetUrl(`heroes/ballroom/${palette}.webp`), objectPosition: "center center", zoom: 1 },
    { id: `${palette}-garden`, name: "Garden ceremony", url: invitationAssetUrl(`heroes/garden/${palette}.webp`), objectPosition: "center center", zoom: 1 },
    { id: `${palette}-islamic-hall`, name: "Pure elegance", url: invitationAssetUrl(`heroes/islamic-hall/${palette}.webp`), objectPosition: "center center", zoom: 1 },
  ];
}

export const heroPresets: Record<PaletteId, HeroPreset[]> = {
  beige: matchedHeroPresets("beige", invitationAssetUrl("heroes/signature/beige.webp")),
  olive: matchedHeroPresets("olive", invitationAssetUrl("heroes/signature/olive.webp")),
  "dusty-blue": matchedHeroPresets("dusty-blue", invitationAssetUrl("heroes/signature/dusty-blue.webp")),
  burgundy: matchedHeroPresets("burgundy", invitationAssetUrl("heroes/signature/burgundy.webp")),
  pink: matchedHeroPresets("pink", invitationAssetUrl("heroes/signature/pink.webp")),
  lilac: matchedHeroPresets("lilac", invitationAssetUrl("heroes/signature/lilac.webp")),
};

export const interactiveHeroPresets: HeroPreset[] = [
  { id: "interactive-henna-hands", name: "Henna promise", url: invitationAssetUrl("heroes/interactive/henna-hands.webp"), objectPosition: "center center", zoom: 1 },
  { id: "interactive-orchid-bouquet", name: "Orchid exchange", url: invitationAssetUrl("heroes/interactive/orchid-bouquet.webp"), objectPosition: "center center", zoom: 1 },
  { id: "interactive-island-walk", name: "Island sunrise", url: invitationAssetUrl("heroes/interactive/island-walk.webp"), objectPosition: "center center", zoom: 1 },
];

export const interactiveFrameAssets: Record<PaletteId, string> = {
  beige: invitationAssetUrl("frames/beige.webp"),
  olive: invitationAssetUrl("frames/olive.webp"),
  "dusty-blue": invitationAssetUrl("frames/dusty-blue.webp"),
  burgundy: invitationAssetUrl("frames/burgundy.webp"),
  pink: invitationAssetUrl("frames/pink.webp"),
  lilac: invitationAssetUrl("frames/lilac.webp"),
};

const bismillahAsset = invitationAssetUrl("bismillah/default.webp");
export const bismillahAssets: Record<PaletteId, string> = {
  beige: bismillahAsset,
  olive: bismillahAsset,
  "dusty-blue": bismillahAsset,
  burgundy: bismillahAsset,
  pink: bismillahAsset,
  lilac: bismillahAsset,
};

export const invitationPricing = {
  base: 1000,
  opening: 200,
  interactiveHero: 200,
} as const;

export const openingOptions = [
  { id: "none" as const, name: "No opening", description: "Guests see the invitation immediately.", price: 0 },
  { id: "envelope" as const, name: "Envelope & wax seal", description: "A full-screen envelope opens from the centre.", price: invitationPricing.opening },
  { id: "curtain" as const, name: "Curtain reveal", description: "Elegant curtains part exactly from the middle.", price: invitationPricing.opening },
] as const;

function paletteAssetUrls(path: string): Record<PaletteId, string> {
  return {
    beige: invitationAssetUrl(`${path}/beige.webp`),
    olive: invitationAssetUrl(`${path}/olive.webp`),
    "dusty-blue": invitationAssetUrl(`${path}/dusty-blue.webp`),
    burgundy: invitationAssetUrl(`${path}/burgundy.webp`),
    pink: invitationAssetUrl(`${path}/pink.webp`),
    lilac: invitationAssetUrl(`${path}/lilac.webp`),
  };
}

export const openingAssets = {
  envelope: [
    { id: "classic-envelope", name: "Classic botanical", urls: paletteAssetUrls("openings/envelopes/classic") },
    { id: "botanical-envelope", name: "Garden botanical", urls: paletteAssetUrls("openings/envelopes/botanical") },
  ],
  curtain: [
    { id: "classic-curtain", name: "Classic florals", urls: paletteAssetUrls("openings/curtains/classic") },
    { id: "botanical-curtain", name: "Garden florals", urls: paletteAssetUrls("openings/curtains/botanical") },
  ],
};

export const sectionDefinitions: Record<SectionType, { name: string; shortName: string; description: string; price: number }> = {
  countdown: { name: "Countdown", shortName: "Countdown", description: "Count down to the celebration date.", price: 150 },
  journey: { name: "Our Timeline", shortName: "Our Timeline", description: "Add as many moments as your story needs.", price: 150 },
  "event-details": { name: "Event Details + Location", shortName: "Event Details", description: "Add every ceremony, venue and map.", price: 150 },
  gift: { name: "Important Notes", shortName: "Important Notes", description: "Share helpful details about gifts, parking or anything else guests should know.", price: 150 },
  "special-message": { name: "A Special Message", shortName: "Special Message", description: "Share gratitude, a dua, dedication, quotation or personal message.", price: 200 },
  seating: { name: "Seating Arrangement", shortName: "Seating", description: "List several families under each table.", price: 200 },
  "day-programme": { name: "Day Programme", shortName: "Programme", description: "Times, programme details and small notes.", price: 200 },
  glimpse: { name: "Glimpse Of Us", shortName: "Glimpse Of Us", description: "A scattered gallery of your photos.", price: 200 },
  custom: { name: "Custom Part", shortName: "Custom Part", description: "Planned and designed with you.", price: 500 },
};

function makeId(type: SectionType) {
  return `${type}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export function createSection(type: SectionType, included = false): InvitationSection {
  const common = { id: makeId(type), type, included, images: [] as string[] };

  switch (type) {
    case "countdown":
      return { ...common, title: "Counting the days", fields: { date: "2027-05-22", time: "18:30", eyebrow: "You are invited to our big day", message: "to the most special day of our lives" }, items: [] };
    case "journey":
      return {
        ...common,
        title: "Our Timeline",
        fields: { introduction: "The moments that brought us here" },
        items: [
          { title: "Our Nikah", date: "16 May 2027", description: "A quiet promise made with our closest family." },
          { title: "Wedding Celebration", date: "22 May 2027", description: "Join us as we celebrate the beginning of our new chapter." },
        ],
      };
    case "event-details":
      return {
        ...common,
        title: "Event Details",
        fields: { introduction: "We cannot wait to celebrate with you. Here is everything you need to know." },
        items: [
          { name: "Mehendi Evening", date: "2027-05-22", time: "18:30", venue: "Royal Green Gardens", address: "Moka, Mauritius", mapUrl: "" },
        ],
      };
    case "gift":
      return { ...common, title: "Important Notes", fields: { message: "Your presence and prayers are the greatest gifts. If you wish, a contribution towards our new chapter would be warmly appreciated." }, items: [] };
    case "special-message":
      return {
        ...common,
        title: "A Special Message",
        fields: {
          eyebrow: "With grateful hearts",
          message: "Thank you for surrounding us with your love, duas and support as we begin this new chapter together.",
          dedicationLabel: "With appreciation",
          recipient: "Our families and guests",
          dedicationNote: "For being part of the moments that brought us here",
          signature: "With love · From both of us",
        },
        items: [],
      };
    case "seating":
      return {
        ...common,
        title: "Seating Arrangement",
        fields: { introduction: "Please find your table below" },
        items: [
          { table: "Table 1", families: "Axel Family\nJohn Family" },
          { table: "Table 2", families: "Rahman Family\nNoor Family" },
        ],
      };
    case "day-programme":
      return {
        ...common,
        title: "Day Programme",
        fields: { introduction: "What we have prepared for you" },
        items: [
          { time: "18:00", details: "Guest arrival", note: "Welcome drinks will be served" },
          { time: "18:30", details: "Nikah ceremony", note: "Please be seated a few minutes early" },
          { time: "19:30", details: "Dinner", note: "Followed by family photographs" },
        ],
      };
    case "glimpse":
      return { ...common, title: "A Glimpse Of Us", fields: { message: "A few favourite memories from the story that brought us here." }, items: [] };
    case "custom":
      return { ...common, title: "Custom Part", fields: { html: "", css: "" }, items: [] };
  }
}

export function createInitialInvitation(): InvitationConfig {
  const includedSections = includedSectionTypes.map((type) => ({ ...createSection(type, true), id: `${type}-included` }));

  return {
    version: 1,
    palette: "beige",
    contact: { name: "", phone: "" },
    bismillah: { enabled: false },
    opening: { type: "none", asset: "classic-envelope", initials: getCoupleInitials("Sara", "Sameer") },
    hero: {
      type: "basic",
      photoSource: "preset",
      presetIndex: 0,
      uploadedUrl: "",
      date: "2027-05-22",
      firstName: "Sara",
      secondName: "Sameer",
      eyebrow: "Together with their families",
      message: "Joyfully invite you to celebrate their wedding",
    },
    sections: includedSections,
  };
}

export function getPalette(id: PaletteId) {
  return paletteOptions.find((palette) => palette.id === id) ?? paletteOptions[0];
}

export function getInvitationThemeVariables(id: PaletteId) {
  const { theme } = getPalette(id);
  return {
    "--invitation-primary": theme.primary,
    "--invitation-secondary": theme.secondary,
    "--invitation-accent": theme.accent,
    "--invitation-background": theme.background,
    "--invitation-background-alt": theme.surface,
    "--invitation-text": theme.ink,
    "--invitation-text-muted": theme.muted,
    "--invitation-border": theme.secondary,
    "--invitation-card": theme.surface,
  } satisfies Record<InvitationThemeVariableName, string>;
}

export function getCoupleInitials(firstName = "", secondName = "") {
  const initial = (name: string) => name.trim().match(/\p{L}/u)?.[0]?.toLocaleUpperCase("en") ?? "";
  return [initial(firstName), initial(secondName)].filter(Boolean).join(" ♥ ");
}

export function getHeroImage(config: InvitationConfig) {
  if (config.hero.type === "interactive" && config.hero.photoSource === "upload" && config.hero.uploadedUrl) return config.hero.uploadedUrl;
  const presets = getHeroPresets(config);
  return presets[config.hero.presetIndex]?.url ?? presets[0].url;
}

export function getHeroPreset(config: InvitationConfig) {
  const presets = getHeroPresets(config);
  return presets[config.hero.presetIndex] ?? presets[0];
}

export function getHeroPresets(config: InvitationConfig) {
  return config.hero.type === "interactive" ? interactiveHeroPresets : heroPresets[config.palette];
}

export function getEventDetails(config: InvitationConfig) {
  return config.sections.find((section) => section.type === "event-details") ?? createSection("event-details", true);
}

export function getSectionItems(section: InvitationSection): InvitationSectionItem[] {
  if (Array.isArray(section.items) && section.items.length) return section.items;

  // Backward-compatible conversion for orders made with the first builder release.
  if (section.type === "journey") {
    return [1, 2].map((number) => ({
      title: section.fields[`event${number}Title`] ?? "",
      date: section.fields[`event${number}Date`] ?? "",
      description: section.fields[`event${number}Text`] ?? "",
    })).filter((item) => Object.values(item).some(Boolean));
  }
  if (section.type === "event-details") {
    return [{
      name: section.fields.name || "Wedding Celebration",
      date: section.fields.date ?? "",
      time: section.fields.time ?? "",
      venue: section.fields.venue ?? "",
      address: section.fields.address ?? "",
      mapUrl: section.fields.mapUrl ?? "",
    }];
  }
  if (section.type === "seating") {
    return (section.fields.tables ?? "").split("\n").map((line) => {
      const [table, ...families] = line.split(/[—|-]/);
      return { table: table?.trim() || "Table", families: families.join(" ").trim() };
    }).filter((item) => item.table || item.families);
  }
  if (section.type === "day-programme") {
    return (section.fields.items ?? "").split("\n").map((line) => {
      const [time, details] = line.split("|");
      return { time: time?.trim() ?? "", details: details?.trim() || time?.trim() || "", note: "" };
    }).filter((item) => item.time || item.details);
  }
  return [];
}

export function normalizeInvitationConfig(config: InvitationConfig): InvitationConfig {
  const eventDetails = config.sections.find((section) => section.type === "event-details");
  const firstEventDate = eventDetails ? getSectionItems(eventDetails)[0]?.date : "";
  const availablePresets = config.hero.type === "interactive" ? interactiveHeroPresets : heroPresets[config.palette];
  const requestedPresetIndex = Number.isInteger(config.hero.presetIndex)
    ? Math.min(Math.max(config.hero.presetIndex, 0), availablePresets.length - 1)
    : 0;
  const presetIndex = config.hero.type === "basic" && availablePresets[requestedPresetIndex]?.hidden
    ? 0
    : requestedPresetIndex;
  return {
    ...config,
    contact: config.contact ?? { name: "", phone: "" },
    bismillah: config.bismillah ?? { enabled: false },
    opening: {
      ...config.opening,
      initials: getCoupleInitials(config.hero.firstName, config.hero.secondName),
    },
    hero: {
      ...config.hero,
      date: config.hero.date || firstEventDate || "2027-05-22",
      photoSource: config.hero.type === "basic" ? "preset" : config.hero.photoSource,
      uploadedUrl: config.hero.type === "basic" ? "" : config.hero.uploadedUrl,
      presetIndex,
    },
    sections: config.sections.map((section) => {
      const defaults = createSection(section.type, section.included).fields;
      const title = section.type === "journey" && (section.title === "Our Journey" || section.title === "Order of Events (Our Journey)")
        ? "Our Timeline"
        : section.type === "gift" && section.title === "Gift Preferences"
          ? "Important Notes"
          : section.title;
      return {
        ...section,
        title,
        fields: section.type === "countdown"
          ? { ...defaults, date: firstEventDate || "2027-05-22", ...section.fields }
          : { ...defaults, ...section.fields },
        items: getSectionItems(section),
      };
    }),
  };
}

export function calculateInvitationPrice(config: InvitationConfig) {
  const openingPrice = config.opening.type === "none" ? 0 : invitationPricing.opening;
  const heroPrice = config.hero.type === "interactive" ? invitationPricing.interactiveHero : 0;
  const remainingIncluded = new Set<SectionType>(includedSectionTypes);
  const sectionsPrice = config.sections.reduce((total, section) => {
    if (section.included && remainingIncluded.has(section.type)) {
      remainingIncluded.delete(section.type);
      return total;
    }
    return total + (sectionDefinitions[section.type]?.price ?? 0);
  }, 0);

  return {
    base: invitationPricing.base,
    opening: openingPrice,
    hero: heroPrice,
    sections: sectionsPrice,
    total: invitationPricing.base + openingPrice + heroPrice + sectionsPrice,
  };
}
