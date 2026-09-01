export type TemplateSlug = "heritage-night" | "rose-garden" | "midnight-vows";

export interface InvitationContent {
  personOneName: string;
  personTwoName: string;
  intro: string;
  message: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface TemplateDefinition {
  slug: TemplateSlug;
  name: string;
  category: string;
  description: string;
  image: string;
  defaultContent: InvitationContent;
}

export const templates: TemplateDefinition[] = [
  {
    slug: "heritage-night",
    name: "Heritage Night",
    category: "Traditional luxury",
    description: "An opulent emerald and antique-gold celebration inspired by South Asian grandeur.",
    image: "/images/heritage-night.webp",
    defaultContent: {
      personOneName: "Your Name",
      personTwoName: "Their Name",
      intro: "Together with their families, joyfully invite you to celebrate their wedding.",
      message: "Your presence will make our celebration complete. We cannot wait to share this beautiful beginning with you.",
      eventDate: "2026-12-05",
      eventTime: "18:30",
      venue: "Your Celebration Venue",
      address: "Add the event address",
      primaryColor: "#0c302d",
      secondaryColor: "#f7ead2",
      accentColor: "#d8a957",
    },
  },
  {
    slug: "rose-garden",
    name: "Rose Garden",
    category: "Romantic botanical",
    description: "Soft watercolour florals and luminous garden details for an intimate celebration.",
    image: "/images/rose-garden.webp",
    defaultContent: {
      personOneName: "Your Name",
      personTwoName: "Their Name",
      intro: "With hearts full of joy, we invite you to share in our most cherished day.",
      message: "Surrounded by the people we love, we will begin our next chapter. It would mean the world to celebrate with you.",
      eventDate: "2026-11-14",
      eventTime: "16:00",
      venue: "Your Garden Venue",
      address: "Add the event address",
      primaryColor: "#6e2938",
      secondaryColor: "#fff8ed",
      accentColor: "#a4763f",
    },
  },
  {
    slug: "midnight-vows",
    name: "Midnight Vows",
    category: "Modern evening",
    description: "A cinematic moonlit setting with black florals, silver light and quiet drama.",
    image: "/images/midnight-vows.webp",
    defaultContent: {
      personOneName: "Your Name",
      personTwoName: "Their Name",
      intro: "Under the evening sky, we invite you to witness the beginning of our forever.",
      message: "Join us for a night of promises, laughter and celebration as two stories become one.",
      eventDate: "2026-10-24",
      eventTime: "19:00",
      venue: "Your Evening Venue",
      address: "Add the event address",
      primaryColor: "#080d15",
      secondaryColor: "#eef0f2",
      accentColor: "#c5a46d",
    },
  },
];

export function getTemplate(slug: string) {
  return templates.find((template) => template.slug === slug);
}

export function formatEventDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Date to be announced";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatEventTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "";

  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}
