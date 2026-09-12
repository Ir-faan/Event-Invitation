import { getSectionItems, type InvitationConfig } from "@/lib/invitation-designer";

export type InvitationOrderStatus = "pending" | "active" | "inactive";

export type InvitationOrderRecord = {
  id: string;
  status: InvitationOrderStatus;
  slug: string | null;
  active_until: string | null;
  total_price: number;
  created_at: string;
  deployed_at: string | null;
  inactive_at: string | null;
  config: InvitationConfig;
};

export type InvitationOrderSummary = Omit<InvitationOrderRecord, "config"> & {
  customerName: string;
  phone: string;
  coupleName: string;
  eventDate: string;
  palette: InvitationConfig["palette"];
  openingType: InvitationConfig["opening"]["type"];
  heroType: InvitationConfig["hero"]["type"];
  sectionCount: number;
};

export function getPrimaryEventDate(config: InvitationConfig) {
  const eventDetails = config.sections.find((section) => section.type === "event-details");
  const eventDate = eventDetails ? getSectionItems(eventDetails).find((item) => item.date)?.date : "";
  const countdownDate = config.sections.find((section) => section.type === "countdown")?.fields.date;
  return eventDate || countdownDate || "";
}

export function getCoupleName(config: InvitationConfig) {
  return [config.hero.firstName, config.hero.secondName].map((name) => name.trim()).filter(Boolean).join(" & ") || "Unnamed invitation";
}

export function summarizeOrder(order: InvitationOrderRecord): InvitationOrderSummary {
  const { config, ...record } = order;
  return {
    ...record,
    customerName: config.contact.name.trim() || "Customer name missing",
    phone: config.contact.phone.trim(),
    coupleName: getCoupleName(config),
    eventDate: getPrimaryEventDate(config),
    palette: config.palette,
    openingType: config.opening.type,
    heroType: config.hero.type,
    sectionCount: config.sections.length,
  };
}

export function todayInMauritius(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Indian/Mauritius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function isValidActiveUntil(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= todayInMauritius();
}

export function makeInvitationSlug(config: InvitationConfig) {
  const names = [config.hero.firstName, config.hero.secondName].map((name) => slugPart(name)).filter(Boolean);
  const slug = names.length ? names.join("-and-") : "invitation";
  return reservedSlugs.has(slug) ? `${slug}-celebration` : slug;
}

const reservedSlugs = new Set(["api", "dashboard", "design-invitation", "templates", "invitation"]);

function slugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}
