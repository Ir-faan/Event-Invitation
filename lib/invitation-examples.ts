import {
  calculateInvitationPrice,
  getCoupleInitials,
  getPalette,
  type HeroType,
  type InvitationConfig,
  type InvitationSection,
  type InvitationSectionItem,
  type OpeningType,
  type PaletteId,
  type SectionType,
} from "@/lib/invitation-designer";

export type InvitationExample = {
  id: string;
  slug: string;
  name: string;
  description: string;
  eventLabel: string;
  thumbnail: string;
  config: InvitationConfig;
};

export type InvitationExampleCard = {
  id: string;
  slug: string;
  name: string;
  description: string;
  eventLabel: string;
  thumbnail: string;
  coupleNames: string;
  paletteName: string;
  price: number;
};

type ExampleSeed = Omit<InvitationExample, "id" | "config"> & {
  palette: PaletteId;
  firstName: string;
  secondName: string;
  date: string;
  bismillah?: boolean;
  opening: { type: OpeningType; asset?: string };
  hero: {
    type: HeroType;
    presetIndex?: number;
    uploadedUrl?: string;
    eyebrow: string;
    message: string;
  };
  sections: InvitationSection[];
};

const generatedPhotos = {
  oliveGarden: "/images/examples/example-couple-olive-garden.webp",
  burgundyHenna: "/images/examples/example-couple-burgundy-henna.webp",
  dustyBlueHall: "/images/examples/example-couple-dusty-blue-hall.webp",
  lilacGarden: "/images/examples/example-couple-lilac-garden.webp",
} as const;

const existingPhotos = {
  hennaHands: "/images/builder-interactive-henna-hands.webp",
  orchid: "/images/builder-interactive-orchid-bouquet.webp",
  islandWalk: "/images/builder-interactive-island-walk.webp",
  bouquet: "/images/builder-interactive-bouquet.webp",
  gardenWalk: "/images/builder-interactive-garden-walk.webp",
  hands: "/images/builder-interactive-hands.webp",
} as const;

function section(
  slug: string,
  type: SectionType,
  title: string,
  fields: Record<string, string>,
  items: InvitationSectionItem[] = [],
  images: string[] = [],
  included = false,
): InvitationSection {
  return { id: `${slug}-${type}`, type, included, title, fields, items, images };
}

function countdown(slug: string, date: string, time: string, title = "Counting the days", message = "until we celebrate together") {
  return section(slug, "countdown", title, { date, time, eyebrow: "You are invited to our big day", message }, [], [], true);
}

function timeline(slug: string, items: InvitationSectionItem[], introduction = "The moments that lead to our new chapter") {
  return section(slug, "journey", "Our Timeline", { introduction }, items, [], true);
}

function eventDetails(slug: string, items: InvitationSectionItem[], introduction = "We would be honoured to celebrate these moments with you.") {
  return section(slug, "event-details", "Event Details", { introduction }, items, [], true);
}

function importantNotes(slug: string, message: string) {
  return section(slug, "gift", "Important Notes", { message }, [], [], true);
}

function programme(slug: string, items: InvitationSectionItem[], introduction = "A little guide to our celebration") {
  return section(slug, "day-programme", "Day Programme", { introduction }, items);
}

function glimpse(slug: string, images: string[], message = "A few favourite memories from the story that brought us here.") {
  return section(slug, "glimpse", "A Glimpse Of Us", { message }, [], images);
}

function seating(slug: string, items: InvitationSectionItem[], introduction = "Please find your family table below") {
  return section(slug, "seating", "Seating Arrangement", { introduction }, items);
}

function specialMessage(slug: string, recipient: string, message: string) {
  return section(slug, "special-message", "In Loving Memory", {
    eyebrow: "With love, always",
    message,
    dedicationLabel: "Remembering with gratitude",
    recipient,
    dedicationNote: "Whose duas and love remain with us",
    signature: "Forever remembered · Forever loved",
  });
}

function event(name: string, date: string, time: string, venue: string, address: string): InvitationSectionItem {
  return { name, date, time, venue, address, mapUrl: "" };
}

function moment(title: string, date: string, description: string): InvitationSectionItem {
  return { title, date, description };
}

function createExample(seed: ExampleSeed): InvitationExample {
  const openingAsset = seed.opening.asset
    ?? (seed.opening.type === "curtain" ? "classic-curtain" : "classic-envelope");
  const uploadedUrl = seed.hero.uploadedUrl ?? "";
  return {
    id: seed.slug,
    slug: seed.slug,
    name: seed.name,
    description: seed.description,
    eventLabel: seed.eventLabel,
    thumbnail: seed.thumbnail,
    config: {
      version: 1,
      palette: seed.palette,
      contact: { name: `${seed.firstName} & ${seed.secondName}`, phone: "50000000" },
      bismillah: { enabled: seed.bismillah ?? true },
      opening: {
        type: seed.opening.type,
        asset: openingAsset,
        initials: getCoupleInitials(seed.firstName, seed.secondName),
      },
      hero: {
        type: seed.hero.type,
        photoSource: seed.hero.type === "interactive" && uploadedUrl ? "upload" : "preset",
        presetIndex: seed.hero.presetIndex ?? 0,
        uploadedUrl,
        date: seed.date,
        firstName: seed.firstName,
        secondName: seed.secondName,
        eyebrow: seed.hero.eyebrow,
        message: seed.hero.message,
      },
      sections: seed.sections,
    },
  };
}

export const invitationExamples: InvitationExample[] = [
  createExample({
    slug: "ivory-promise",
    name: "Ivory Promise",
    description: "A graceful, minimal invitation centred on the nikah and walimah.",
    eventLabel: "Nikkah + Walimah",
    thumbnail: "/images/examples/ivory-promise-thumb.webp",
    palette: "beige",
    firstName: "Aaliyah",
    secondName: "Zayd",
    date: "2027-02-20",
    opening: { type: "none" },
    hero: {
      type: "basic",
      presetIndex: 4,
      eyebrow: "Together with their families",
      message: "Request the honour of your presence as they begin their life together",
    },
    sections: [
      countdown("ivory-promise", "2027-02-20", "18:30", "Until our Walimah"),
      timeline("ivory-promise", [
        moment("Our Nikkah", "19 February 2027", "A sacred promise made in the presence of family and friends."),
        moment("Walimah Celebration", "20 February 2027", "An evening of duas, dinner and joyful company."),
      ]),
      eventDetails("ivory-promise", [
        event("Nikkah", "2027-02-19", "14:00", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Walimah Dinner", "2027-02-20", "18:30", "Taher Bagh", "Port Louis, Mauritius"),
      ]),
      importantNotes("ivory-promise", "Your presence and duas are the greatest gifts. Kindly arrive fifteen minutes before the Nikkah begins."),
    ],
  }),
  createExample({
    slug: "olive-serenity",
    name: "Olive Serenity",
    description: "Botanical details, an envelope opening and a personal photo reveal.",
    eventLabel: "Nikkah + Dinner",
    thumbnail: "/images/examples/olive-serenity-thumb.webp",
    palette: "olive",
    firstName: "Mariam",
    secondName: "Imraan",
    date: "2027-04-10",
    opening: { type: "envelope", asset: "botanical-envelope" },
    hero: {
      type: "interactive",
      uploadedUrl: generatedPhotos.oliveGarden,
      eyebrow: "By the grace of Allah",
      message: "We invite you to share in the joy of our wedding celebration",
    },
    sections: [
      timeline("olive-serenity", [
        moment("The Nikkah", "9 April 2027", "Our promise, surrounded by the people who shaped us."),
        moment("Dinner Together", "10 April 2027", "A relaxed evening of food, laughter and family."),
      ], "Two beautiful days, one new beginning"),
      countdown("olive-serenity", "2027-04-10", "19:00", "Our celebration begins"),
      glimpse("olive-serenity", [generatedPhotos.oliveGarden, existingPhotos.hennaHands, existingPhotos.bouquet, existingPhotos.gardenWalk]),
      eventDetails("olive-serenity", [
        event("Nikkah", "2027-04-09", "15:00", "Inous Hafez Hall", "Sodnac, Phoenix"),
        event("Wedding Dinner", "2027-04-10", "19:00", "Taher Bagh", "Port Louis, Mauritius"),
      ]),
      importantNotes("olive-serenity", "Please keep us in your duas. Parking attendants will guide guests on arrival, and dinner will be served at 20:00."),
    ],
  }),
  createExample({
    slug: "dusty-blue-elegance",
    name: "Dusty Blue Elegance",
    description: "A refined ballroom invitation with a curtain reveal and detailed programme.",
    eventLabel: "Mehendi + Nikkah + Walimah",
    thumbnail: "/images/examples/dusty-blue-elegance-thumb.webp",
    palette: "dusty-blue",
    firstName: "Safiyyah",
    secondName: "Yusuf",
    date: "2027-06-19",
    opening: { type: "curtain", asset: "classic-curtain" },
    hero: {
      type: "basic",
      presetIndex: 2,
      eyebrow: "With joyful hearts and grateful families",
      message: "Invite you to celebrate three cherished wedding moments",
    },
    sections: [
      countdown("dusty-blue-elegance", "2027-06-19", "18:00", "Until our Walimah", "to an evening we cannot wait to share"),
      programme("dusty-blue-elegance", [
        { time: "17:45", details: "Guest arrival", note: "Welcome refreshments will be served" },
        { time: "18:30", details: "Family photographs", note: "Immediate family will be invited first" },
        { time: "19:30", details: "Walimah dinner", note: "Followed by dessert and tea" },
        { time: "21:30", details: "Farewell", note: "Thank you for celebrating with us" },
      ]),
      eventDetails("dusty-blue-elegance", [
        event("Mehendi Evening", "2027-06-17", "18:30", "Family Residence", "Quatre Bornes, Mauritius"),
        event("Nikkah", "2027-06-18", "14:30", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Walimah", "2027-06-19", "18:00", "Port Louis Gymkhana", "Port Louis, Mauritius"),
      ]),
      timeline("dusty-blue-elegance", [
        moment("Mehendi", "17 June 2027", "An intimate evening of colour, family and tradition."),
        moment("Nikkah", "18 June 2027", "The promise at the heart of our celebration."),
        moment("Walimah", "19 June 2027", "A beautiful evening shared with everyone we love."),
      ]),
      importantNotes("dusty-blue-elegance", "The Mehendi is for close family. All guests are warmly invited to the Nikkah and Walimah."),
    ],
  }),
  createExample({
    slug: "burgundy-romance",
    name: "Burgundy Romance",
    description: "A premium four-day celebration with rich colour and every finishing detail.",
    eventLabel: "Four wedding events",
    thumbnail: "/images/examples/burgundy-romance-thumb.webp",
    palette: "burgundy",
    firstName: "Ayesha",
    secondName: "Hamza",
    date: "2027-08-14",
    opening: { type: "envelope", asset: "classic-envelope" },
    hero: {
      type: "interactive",
      uploadedUrl: generatedPhotos.burgundyHenna,
      eyebrow: "Four days of love, faith and family",
      message: "Join us as our most treasured traditions become one story",
    },
    sections: [
      countdown("burgundy-romance", "2027-08-14", "18:30", "The celebration awaits"),
      timeline("burgundy-romance", [
        moment("Mehendi", "11 August 2027", "Henna, music and a joyful evening with our closest family."),
        moment("Chawtari", "12 August 2027", "A beloved tradition shared across both families."),
        moment("Nikkah", "13 August 2027", "The moment we say qubool hai."),
        moment("Walimah", "14 August 2027", "Our first celebration as husband and wife."),
      ]),
      programme("burgundy-romance", [
        { time: "18:00", details: "Doors open", note: "Ushers will help you find your table" },
        { time: "18:30", details: "Couple entrance", note: "Please be seated before the entrance" },
        { time: "19:15", details: "Dinner service", note: "A halal buffet will be served" },
        { time: "21:00", details: "Dessert & photographs", note: "The photo area remains open all evening" },
      ], "Your guide to the Walimah evening"),
      glimpse("burgundy-romance", [generatedPhotos.burgundyHenna, existingPhotos.hennaHands, existingPhotos.hands, existingPhotos.orchid, generatedPhotos.oliveGarden], "From our first family gathering to the day we chose forever."),
      eventDetails("burgundy-romance", [
        event("Mehendi", "2027-08-11", "18:00", "Family Residence", "Curepipe, Mauritius"),
        event("Chawtari", "2027-08-12", "17:30", "Inous Hafez Hall", "Sodnac, Phoenix"),
        event("Nikkah", "2027-08-13", "14:00", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Walimah Dinner", "2027-08-14", "18:30", "Taher Bagh", "Port Louis, Mauritius"),
      ], "Four celebrations, each with its own place in our hearts."),
      seating("burgundy-romance", [
        { table: "Table 1", families: "Rahman Family\nAumeer Family" },
        { table: "Table 2", families: "Noor Family\nMulla Family" },
        { table: "Table 3", families: "Jhummun Family\nOozeer Family" },
        { table: "Table 4", families: "Friends of the Bride\nFriends of the Groom" },
      ]),
      specialMessage("burgundy-romance", "Our beloved grandparents", "Although you cannot sit beside us today, your values, stories and love are woven into every moment of this celebration."),
      importantNotes("burgundy-romance", "Separate family seating is available. Please mention any dietary requirements to the family before 1 August."),
    ],
  }),
  createExample({
    slug: "blush-reverie",
    name: "Blush Reverie",
    description: "A soft, photo-led invitation for an intimate and romantic celebration.",
    eventLabel: "Nikkah + Dinner",
    thumbnail: "/images/examples/blush-reverie-thumb.webp",
    palette: "pink",
    firstName: "Sumayyah",
    secondName: "Ridwaan",
    date: "2027-10-23",
    bismillah: false,
    opening: { type: "none" },
    hero: {
      type: "basic",
      presetIndex: 3,
      eyebrow: "A little love, a lifetime of duas",
      message: "We would love for you to be part of our intimate wedding weekend",
    },
    sections: [
      glimpse("blush-reverie", [generatedPhotos.lilacGarden, existingPhotos.orchid, existingPhotos.hands, existingPhotos.bouquet, generatedPhotos.oliveGarden], "The quiet moments, shared smiles and favourite places that became our story."),
      countdown("blush-reverie", "2027-10-23", "19:00", "Our forever starts soon"),
      timeline("blush-reverie", [
        moment("Nikkah", "22 October 2027", "An intimate afternoon surrounded by our families."),
        moment("Dinner", "23 October 2027", "A candlelit evening with the people closest to us."),
      ]),
      eventDetails("blush-reverie", [
        event("Nikkah", "2027-10-22", "15:00", "Inous Hafez Hall", "Sodnac, Phoenix"),
        event("Wedding Dinner", "2027-10-23", "19:00", "Port Louis Gymkhana", "Port Louis, Mauritius"),
      ]),
      importantNotes("blush-reverie", "This is an intimate celebration. Your presence, warm wishes and duas mean everything to us."),
    ],
  }),
  createExample({
    slug: "lavender-whispers",
    name: "Lavender Whispers",
    description: "A lilac envelope invitation with thoughtful programme and remembrance.",
    eventLabel: "Mehendi + Nikkah + Walimah",
    thumbnail: "/images/examples/lavender-whispers-thumb.webp",
    palette: "lilac",
    firstName: "Fatimah",
    secondName: "Umar",
    date: "2027-12-18",
    opening: { type: "envelope", asset: "botanical-envelope" },
    hero: {
      type: "basic",
      presetIndex: 4,
      eyebrow: "In the name of Allah, the Most Gracious",
      message: "Together with our families, we invite you to our wedding celebrations",
    },
    sections: [
      specialMessage("lavender-whispers", "Nana & Nani", "We carry your gentle guidance with us as we begin this new chapter, and remember you with love on our happiest day."),
      countdown("lavender-whispers", "2027-12-18", "18:30", "Counting every blessing"),
      timeline("lavender-whispers", [
        moment("Mehendi Evening", "16 December 2027", "A colourful start to our wedding celebrations."),
        moment("Our Nikkah", "17 December 2027", "A promise made with gratitude and faith."),
        moment("Walimah", "18 December 2027", "Dinner, duas and a beautiful evening together."),
      ]),
      programme("lavender-whispers", [
        { time: "18:15", details: "Guest welcome", note: "Please make your way to the main hall" },
        { time: "18:45", details: "Family entrance", note: "Followed by the newlyweds" },
        { time: "19:30", details: "Dinner", note: "Tea and dessert will follow" },
      ]),
      eventDetails("lavender-whispers", [
        event("Mehendi", "2027-12-16", "18:30", "Family Residence", "Rose Hill, Mauritius"),
        event("Nikkah", "2027-12-17", "14:30", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Walimah", "2027-12-18", "18:30", "Taher Bagh", "Port Louis, Mauritius"),
      ]),
      importantNotes("lavender-whispers", "Kindly avoid boxed gifts. A private prayer area and family seating will be available at the Walimah."),
    ],
  }),
  createExample({
    slug: "pearl-garden",
    name: "Pearl Garden",
    description: "A luminous garden story with curtains, scratch reveal and family seating.",
    eventLabel: "Nikkah + Walimah",
    thumbnail: "/images/examples/pearl-garden-thumb.webp",
    palette: "beige",
    firstName: "Zainab",
    secondName: "Ismail",
    date: "2028-01-29",
    opening: { type: "curtain", asset: "botanical-curtain" },
    hero: {
      type: "interactive",
      presetIndex: 1,
      eyebrow: "Our favourite chapter is about to begin",
      message: "Scratch the photograph and join us for two days of celebration",
    },
    sections: [
      countdown("pearl-garden", "2028-01-29", "18:00", "Until the garden lights glow"),
      glimpse("pearl-garden", [existingPhotos.orchid, existingPhotos.gardenWalk, generatedPhotos.oliveGarden, existingPhotos.bouquet, existingPhotos.hands]),
      timeline("pearl-garden", [
        moment("Nikkah", "28 January 2028", "Our families gather as we make our promise."),
        moment("Walimah", "29 January 2028", "An evening beneath the lights to celebrate our beginning."),
      ]),
      eventDetails("pearl-garden", [
        event("Nikkah", "2028-01-28", "15:30", "Inous Hafez Hall", "Sodnac, Phoenix"),
        event("Walimah", "2028-01-29", "18:00", "Port Louis Gymkhana", "Port Louis, Mauritius"),
      ]),
      seating("pearl-garden", [
        { table: "Pearl", families: "Bride's Family\nGroom's Family" },
        { table: "Olive", families: "Aunts & Uncles\nFamily Friends" },
        { table: "Garden", families: "Cousins\nUniversity Friends" },
      ], "Your table is named after our garden palette"),
      importantNotes("pearl-garden", "The garden photographs begin at 17:30. Please arrive early if you would like a portrait before dinner."),
    ],
  }),
  createExample({
    slug: "midnight-bloom",
    name: "Midnight Bloom",
    description: "A dramatic wine-toned evening invitation with a meaningful family tribute.",
    eventLabel: "Chawtari + Nikkah + Dinner",
    thumbnail: "/images/examples/midnight-bloom-thumb.webp",
    palette: "burgundy",
    firstName: "Sarah",
    secondName: "Rayyaan",
    date: "2028-03-18",
    bismillah: false,
    opening: { type: "none" },
    hero: {
      type: "basic",
      presetIndex: 0,
      eyebrow: "Under the evening lights",
      message: "Join us for a celebration shaped by family, faith and friendship",
    },
    sections: [
      countdown("midnight-bloom", "2028-03-18", "19:00", "Until our evening begins"),
      eventDetails("midnight-bloom", [
        event("Chawtari", "2028-03-16", "17:30", "Family Residence", "Beau Bassin, Mauritius"),
        event("Nikkah", "2028-03-17", "14:00", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Wedding Dinner", "2028-03-18", "19:00", "Taher Bagh", "Port Louis, Mauritius"),
      ]),
      programme("midnight-bloom", [
        { time: "18:45", details: "Guest arrival", note: "Mocktails will be served in the foyer" },
        { time: "19:20", details: "Newlywed entrance", note: "Please take your seats" },
        { time: "20:00", details: "Dinner", note: "Followed by dessert and photographs" },
      ]),
      timeline("midnight-bloom", [
        moment("Chawtari", "16 March 2028", "A family tradition filled with laughter and colour."),
        moment("Nikkah", "17 March 2028", "Our promise and the beginning of our next chapter."),
        moment("Dinner", "18 March 2028", "A warm evening shared with all of you."),
      ]),
      specialMessage("midnight-bloom", "Our late grandparents", "Your love built the families joining today. We feel your presence in the stories, prayers and traditions surrounding us."),
      importantNotes("midnight-bloom", "Evening attire is encouraged. The venue has on-site parking, and ushers will be available from 18:30."),
    ],
  }),
  createExample({
    slug: "golden-nikkah",
    name: "Golden Nikkah",
    description: "An olive and gold family celebration with a classic envelope entrance.",
    eventLabel: "Nikkah + Same-day Walimah",
    thumbnail: "/images/examples/golden-nikkah-thumb.webp",
    palette: "olive",
    firstName: "Inaya",
    secondName: "Zakariya",
    date: "2028-05-27",
    opening: { type: "envelope", asset: "classic-envelope" },
    hero: {
      type: "basic",
      presetIndex: 3,
      eyebrow: "One day, two beautiful moments",
      message: "We invite you to our Nikkah and Walimah as we begin with bismillah",
    },
    sections: [
      timeline("golden-nikkah", [
        moment("Nikkah Ceremony", "27 May 2028 · 14:00", "Our promise in the company of family and friends."),
        moment("Walimah Reception", "27 May 2028 · 18:30", "Dinner and duas as the day turns golden."),
      ], "A simple celebration, all in one special day"),
      countdown("golden-nikkah", "2028-05-27", "14:00", "Until we say qubool hai"),
      eventDetails("golden-nikkah", [
        event("Nikkah", "2028-05-27", "14:00", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Walimah Reception", "2028-05-27", "18:30", "Inous Hafez Hall", "Sodnac, Phoenix"),
      ]),
      seating("golden-nikkah", [
        { table: "Table 1", families: "Noor Family\nHossen Family" },
        { table: "Table 2", families: "Moollan Family\nOsman Family" },
        { table: "Table 3", families: "School Friends\nWork Friends" },
      ]),
      importantNotes("golden-nikkah", "Guests attending both events may relax in the family lounge between the Nikkah and Walimah."),
    ],
  }),
  createExample({
    slug: "lilac-moonlight",
    name: "Lilac Moonlight",
    description: "A romantic four-event invitation with curtains, scratch reveal and photo story.",
    eventLabel: "Mehendi to Walimah",
    thumbnail: "/images/examples/lilac-moonlight-thumb.webp",
    palette: "lilac",
    firstName: "Hana",
    secondName: "Adam",
    date: "2028-07-22",
    opening: { type: "curtain", asset: "botanical-curtain" },
    hero: {
      type: "interactive",
      uploadedUrl: generatedPhotos.lilacGarden,
      eyebrow: "A celebration written in moonlight",
      message: "Reveal our photograph, then follow the four moments of our wedding story",
    },
    sections: [
      countdown("lilac-moonlight", "2028-07-22", "18:30", "Until our Walimah"),
      programme("lilac-moonlight", [
        { time: "18:00", details: "Welcome", note: "Refreshments and guest book" },
        { time: "18:40", details: "Couple entrance", note: "Followed by a short family dua" },
        { time: "19:30", details: "Dinner service", note: "Dessert bar opens at 20:30" },
        { time: "21:15", details: "Family farewell", note: "Thank you for being part of our story" },
      ]),
      timeline("lilac-moonlight", [
        moment("Mehendi", "19 July 2028", "A joyful evening of henna and family traditions."),
        moment("Chawtari", "20 July 2028", "Both families come together before the Nikkah."),
        moment("Nikkah", "21 July 2028", "The promise that begins our life together."),
        moment("Walimah", "22 July 2028", "Our moonlit celebration with everyone we love."),
      ]),
      glimpse("lilac-moonlight", [generatedPhotos.lilacGarden, generatedPhotos.dustyBlueHall, existingPhotos.islandWalk, existingPhotos.orchid, existingPhotos.hennaHands], "A handful of memories from the path that brought us to this beautiful week."),
      eventDetails("lilac-moonlight", [
        event("Mehendi", "2028-07-19", "18:30", "Family Residence", "Moka, Mauritius"),
        event("Chawtari", "2028-07-20", "17:30", "Inous Hafez Hall", "Sodnac, Phoenix"),
        event("Nikkah", "2028-07-21", "14:30", "Sir Abdul Razack Mohamed Hall", "Phoenix, Mauritius"),
        event("Walimah", "2028-07-22", "18:30", "Port Louis Gymkhana", "Port Louis, Mauritius"),
      ]),
      importantNotes("lilac-moonlight", "Please use the event cards above for the correct day and venue. Children are warmly welcome at the Walimah."),
    ],
  }),
];

export function getInvitationExample(slug: string) {
  return invitationExamples.find((example) => example.slug === slug);
}

export function getInvitationExamplePrice(example: InvitationExample) {
  return calculateInvitationPrice(example.config).total;
}

export function getInvitationExampleCards(): InvitationExampleCard[] {
  return invitationExamples.map((example) => ({
    id: example.id,
    slug: example.slug,
    name: example.name,
    description: example.description,
    eventLabel: example.eventLabel,
    thumbnail: example.thumbnail,
    coupleNames: `${example.config.hero.firstName} & ${example.config.hero.secondName}`,
    paletteName: getPalette(example.config.palette).name,
    price: getInvitationExamplePrice(example),
  }));
}
