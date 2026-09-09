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

export type InvitationSection = {
  id: string;
  type: SectionType;
  included: boolean;
  title: string;
  fields: Record<string, string>;
  images: string[];
};

export type InvitationConfig = {
  version: 1;
  palette: PaletteId;
  opening: {
    type: OpeningType;
    asset: string;
    initials: string;
  };
  hero: {
    type: HeroType;
    photoSource: "preset" | "upload";
    presetIndex: 0 | 1;
    uploadedUrl: string;
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
    description: "Soft ivory and warm sand",
    colors: ["#f5ecdf", "#fffaf2", "#aa8562"],
    theme: { background: "#f5ecdf", surface: "#fffaf2", primary: "#79543d", secondary: "#d7bea1", accent: "#b88b52", ink: "#3d2c23", muted: "#765f52" },
  },
  {
    id: "olive" as const,
    name: "Olive Green",
    description: "Botanical olive and cream",
    colors: ["#65704b", "#a7aa7e", "#f0eadb"],
    theme: { background: "#e9e6d7", surface: "#f7f3e8", primary: "#59623e", secondary: "#9ca378", accent: "#b69a5c", ink: "#303623", muted: "#687052" },
  },
  {
    id: "dusty-blue" as const,
    name: "Dusty Blue",
    description: "Calm blue-grey and silver",
    colors: ["#71879a", "#adbdc9", "#edf2f4"],
    theme: { background: "#e8eef1", surface: "#f8fbfc", primary: "#536c80", secondary: "#a8bac7", accent: "#8197a8", ink: "#293a47", muted: "#607482" },
  },
  {
    id: "burgundy" as const,
    name: "Burgundy / Wine",
    description: "Deep wine and muted gold",
    colors: ["#55212b", "#8b4c56", "#efe0dc"],
    theme: { background: "#efe1de", surface: "#fff8f5", primary: "#5a1f2a", secondary: "#b9878b", accent: "#c2a05e", ink: "#38161d", muted: "#765159" },
  },
  {
    id: "pink" as const,
    name: "Pink",
    description: "Blush rose and soft ivory",
    colors: ["#c88e9a", "#e7bdc5", "#fff0f2"],
    theme: { background: "#f7e5e8", surface: "#fff7f8", primary: "#9b5e6b", secondary: "#d9a8b2", accent: "#bf8b74", ink: "#4c2a31", muted: "#80636a" },
  },
  {
    id: "lilac" as const,
    name: "Purple / Lilac",
    description: "Romantic lilac and pearl",
    colors: ["#75617f", "#b8a2c1", "#f1eaf3"],
    theme: { background: "#eee7f1", surface: "#faf6fb", primary: "#6d5676", secondary: "#b6a0bf", accent: "#9e7e9d", ink: "#3d3043", muted: "#706176" },
  },
] as const;

export const heroPresets: Record<PaletteId, Array<{ name: string; url: string }>> = {
  beige: [
    { name: "Soft florals", url: "/images/coastal-reverie.webp" },
    { name: "Ivory romance", url: "/images/rose-scratch-hero.webp" },
  ],
  olive: [
    { name: "Olive hands", url: "/images/rose-couple-hands-default.webp" },
    { name: "Garden moment", url: "/images/rose-scratch-hero-olive.webp" },
  ],
  "dusty-blue": [
    { name: "Blue promise", url: "/images/builder-hero-dusty-blue.webp" },
    { name: "Moonlit flowers", url: "/images/moonlit-bloom.webp" },
  ],
  burgundy: [
    { name: "Velvet promise", url: "/images/builder-hero-burgundy.webp" },
    { name: "Wine florals", url: "/images/rose-afterglow.webp" },
  ],
  pink: [
    { name: "Rose garden", url: "/images/rose-scratch-hero-wide.webp" },
    { name: "Blush afterglow", url: "/images/rose-afterglow.webp" },
  ],
  lilac: [
    { name: "Lilac promise", url: "/images/builder-hero-lilac.webp" },
    { name: "Moonlit romance", url: "/images/moonlit-bloom.webp" },
  ],
};

export const openingOptions = [
  { id: "none" as const, name: "No opening", description: "Guests see the invitation immediately.", price: 0 },
  { id: "envelope" as const, name: "Envelope & wax seal", description: "An envelope opens with your initials.", price: 200 },
  { id: "curtain" as const, name: "Curtain reveal", description: "Elegant curtains part to reveal the invitation.", price: 200 },
] as const;

export const openingAssets = {
  envelope: [
    { id: "classic-envelope", name: "Classic envelope", url: "/images/ivory-envelope-desktop.webp" },
    { id: "botanical-envelope", name: "Botanical envelope", url: "/images/forest-envelope-desktop.webp" },
  ],
  curtain: [
    { id: "classic-curtain", name: "Classic drape", url: "/images/rose-wedding-curtains.webp" },
    { id: "botanical-curtain", name: "Botanical drape", url: "/images/rose-wedding-curtains-olive.webp" },
  ],
};

export const sectionDefinitions: Record<SectionType, { name: string; shortName: string; description: string; price: number }> = {
  countdown: { name: "Countdown", shortName: "Countdown", description: "Count down to the celebration date.", price: 150 },
  journey: { name: "Order of Events (Our Journey)", shortName: "Our Journey", description: "Share the important moments in order.", price: 150 },
  "event-details": { name: "Event Details + Location", shortName: "Event Details", description: "Date, time, venue and map link.", price: 150 },
  gift: { name: "Gift Preferences", shortName: "Gift Preferences", description: "A kind note about gifts.", price: 150 },
  "special-message": { name: "A Special Message", shortName: "Special Message", description: "A dedication, thank-you or loving memory.", price: 150 },
  seating: { name: "Seating Arrangement", shortName: "Seating", description: "Help guests find their table.", price: 150 },
  "day-programme": { name: "Day Programme", shortName: "Programme", description: "Show the schedule for the day.", price: 150 },
  glimpse: { name: "Glimpse Of Us", shortName: "Glimpse Of Us", description: "A small gallery of your photos.", price: 150 },
  custom: { name: "Custom Part", shortName: "Custom Part", description: "A specially planned part that is not listed.", price: 500 },
};

function makeId(type: SectionType) {
  return `${type}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

export function createSection(type: SectionType, included = false): InvitationSection {
  const common = { id: makeId(type), type, included, images: [] as string[] };

  switch (type) {
    case "countdown":
      return { ...common, title: "Counting down to our day", fields: { message: "We cannot wait to celebrate this beautiful moment with you." } };
    case "journey":
      return {
        ...common,
        title: "Our Journey",
        fields: {
          event1Title: "Our Nikah",
          event1Date: "16 May 2027",
          event1Text: "A quiet promise made with our closest family.",
          event2Title: "Wedding Celebration",
          event2Date: "22 May 2027",
          event2Text: "Join us as we celebrate the beginning of our new chapter.",
        },
      };
    case "event-details":
      return {
        ...common,
        title: "Event Details",
        fields: {
          date: "2027-05-22",
          time: "18:30",
          venue: "Royal Palm Hall",
          address: "Port Louis, Mauritius",
          mapUrl: "",
        },
      };
    case "gift":
      return { ...common, title: "Gift Preferences", fields: { message: "Your presence and prayers are the greatest gifts. If you wish, a contribution towards our new chapter would be warmly appreciated." } };
    case "special-message":
      return { ...common, title: "In Loving Memory", fields: { recipient: "Our beloved grandparents", message: "Though you cannot be here in person, your love remains part of every step we take." } };
    case "seating":
      return { ...common, title: "Seating Arrangement", fields: { tables: "Table 1 — Family A\nTable 2 — Family B\nTable 3 — Friends\nTable 4 — Colleagues" } };
    case "day-programme":
      return { ...common, title: "Day Programme", fields: { items: "18:00|Guest arrival\n18:30|Nikah ceremony\n19:00|Family photographs\n19:30|Dinner" } };
    case "glimpse":
      return { ...common, title: "A Glimpse Of Us", fields: { message: "A few moments from the story that brought us here." } };
    case "custom":
      return { ...common, title: "Our Custom Part", fields: { message: "Describe the custom part you would like us to create during your free consultation." } };
  }
}

export function createInitialInvitation(): InvitationConfig {
  const includedSections = includedSectionTypes.map((type) => ({
    ...createSection(type, true),
    id: `${type}-included`,
  }));

  return {
    version: 1,
    palette: "beige",
    opening: { type: "none", asset: "classic-envelope", initials: "S ♥ S" },
    hero: {
      type: "basic",
      photoSource: "preset",
      presetIndex: 0,
      uploadedUrl: "",
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

export function getHeroImage(config: InvitationConfig) {
  if (config.hero.photoSource === "upload" && config.hero.uploadedUrl) return config.hero.uploadedUrl;
  return heroPresets[config.palette][config.hero.presetIndex]?.url ?? heroPresets[config.palette][0].url;
}

export function getEventDetails(config: InvitationConfig) {
  return config.sections.find((section) => section.type === "event-details") ?? createSection("event-details", true);
}

export function calculateInvitationPrice(config: InvitationConfig) {
  const openingPrice = config.opening.type === "none" ? 0 : 200;
  const heroPrice = config.hero.type === "interactive" ? 100 : 0;
  const remainingIncluded = new Set<SectionType>(includedSectionTypes);
  const sectionsPrice = config.sections.reduce((total, section) => {
    if (section.included && remainingIncluded.has(section.type)) {
      remainingIncluded.delete(section.type);
      return total;
    }
    return total + (sectionDefinitions[section.type]?.price ?? 0);
  }, 0);

  return {
    base: 1000,
    opening: openingPrice,
    hero: heroPrice,
    sections: sectionsPrice,
    total: 1000 + openingPrice + heroPrice + sectionsPrice,
  };
}
