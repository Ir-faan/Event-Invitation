import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false, ws: false } });
after(async () => vite.close());

// Synthetic provider responses exercise the real server auth/rate-limit code.
process.env.SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
const fixturePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
function apiRequest(url, init = {}) {
  const headers = new Headers(init.headers);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  if (String(url).includes("/api/dashboard/")) {
    headers.set("Origin", new URL(url).origin);
    headers.set("Cookie", "paperless_sb_access=test-admin");
  }
  if (!headers.has("Idempotency-Key")) headers.set("Idempotency-Key", "dddddddd-dddd-4ddd-addd-dddddddddddd");
  return new Request(url, { ...init, headers });
}
function providerSecurity(url) {
  if (url.endsWith("/rest/v1/rpc/consume_request_limit")) return Response.json(true);
  if (url.endsWith("/auth/v1/user")) return Response.json({ id: "11111111-1111-4111-8111-111111111111" });
  if (url.includes("/rest/v1/dashboard_admins?")) return Response.json([{ user_id: "11111111-1111-4111-8111-111111111111" }]);
  if (url.includes("/rest/v1/media_cleanup")) return Response.json([]);
}

function jpegDimensions(buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const segmentLength = buffer.readUInt16BE(offset);
    const isStartOfFrame = (marker >= 0xc0 && marker <= 0xc3)
      || (marker >= 0xc5 && marker <= 0xc7)
      || (marker >= 0xc9 && marker <= 0xcb)
      || (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame) return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    offset += segmentLength;
  }
  throw new Error("JPEG dimensions could not be read");
}
test("renders the complete Paperless Invites landing page", async () => {
  const { default: Home } = await vite.ssrLoadModule("/app/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.match(html, /The most elegant/);
  assert.match(html, /Ivory Promise/);
  assert.match(html, /Olive Serenity/);
  assert.match(html, /Aaliyah &amp; Zayd/);
  assert.match(html, /Approx\. Rs 1,000/);
  assert.match(html, /\/examples\/ivory-promise/);
  assert.match(html, /Make the first tap/);
  assert.match(html, /Paper or digital/);
  assert.match(html, /Simple pricing/);
  assert.match(html, /Your celebration/);
  assert.match(html, /\/design-invitation/);
  assert.match(html, /href="\/examples\/ivory-promise"/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("renders the guided invitation designer and mobile preview", async () => {
  const { default: Designer } = await vite.ssrLoadModule("/app/design-invitation/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Designer));
  assert.match(html, /Create your invitation/);
  assert.match(html, /Choose your colours/);
  assert.match(html, /Add arabic calligraphy at the top/);
  assert.match(html, /Show Arabic Calligraphy/);
  assert.match(html, /Envelope &amp; wax seal/);
  assert.match(html, /Interactive/);
  assert.match(html, /A Special Message/);
  assert.match(html, /Our Timeline/);
  assert.match(html, /Important Notes/);
  assert.match(html, /Live mobile preview/);
  assert.match(html, /Save my design/);
  assert.match(html, /Rs 1,000/);
  assert.match(html, /Add a moment/);
  assert.match(html, /Add another event/);
  assert.match(html, /Date to count down to/);
  assert.match(html, /Time to count down to/);
  assert.match(html, /Choose an additional part/);
  assert.match(html, /\+ Rs 150/);
  assert.match(html, /For the easiest design experience/);
  assert.match(html, /Your name/);
  assert.match(html, /Mauritian phone or WhatsApp number/);
  assert.match(html, /Wedding date/);
  assert.match(html, /Once your order is ready/);
  assert.match(html, /For example: Aisha Rahman/);
  assert.match(html, /For example: 58749327/);
  assert.doesNotMatch(html, /Closer crop/);
  assert.doesNotMatch(html, /Initials for the wax seal/);
  assert.doesNotMatch(html, /White calligraphy/);
  assert.match(html, /Grand ballroom/);
  assert.match(html, /Garden ceremony/);
  assert.match(html, /Pure elegance/);

  const countdownEyebrow = html.indexOf("Small text above the countdown");
  const countdownHeading = html.indexOf("Section heading", countdownEyebrow);
  const countdownMessage = html.indexOf("Text below the countdown title", countdownHeading);
  const countdownDate = html.indexOf("Date to count down to", countdownMessage);
  const countdownTime = html.indexOf("Time to count down to", countdownDate);
  assert.ok(countdownEyebrow >= 0 && countdownEyebrow < countdownHeading && countdownHeading < countdownMessage && countdownMessage < countdownDate && countdownDate < countdownTime);

  const timelineIntroduction = html.indexOf("Small introduction", countdownDate);
  const timelineHeading = html.indexOf("Section heading", timelineIntroduction);
  assert.ok(timelineIntroduction >= 0 && timelineIntroduction < timelineHeading);

});

test("includes exact palette artwork for the builder", async () => {
  const palettes = ["beige", "olive", "dusty-blue", "burgundy", "pink", "lilac"];
  const assets = palettes.flatMap((palette) => [
    `builder-bismillah-${palette}.webp`,
    `builder-envelope-classic-${palette}.webp`,
    `builder-envelope-botanical-${palette}.webp`,
    `builder-curtain-classic-${palette}.webp`,
    `builder-curtain-botanical-${palette}.webp`,
    `builder-hero-ballroom-${palette}.webp`,
    `builder-hero-garden-${palette}.webp`,
    `builder-hero-islamic-hall-${palette}.webp`,
  ]);
  assets.push(
    "builder-interactive-henna-hands.webp",
    "builder-interactive-orchid-bouquet.webp",
    "builder-interactive-island-walk.webp",
  );
  await Promise.all(assets.map((asset) => access(new URL(`../public/images/${asset}`, import.meta.url))));
});

test("uses the revised hero, photo choices and additional-part prices", async () => {
  const { bismillahAssets, invitationAssetVersion, calculateInvitationPrice, createInitialInvitation, createSection, getCoupleInitials, heroPresets, interactiveFrameAssets, interactiveHeroPresets, openingAssets, sectionDefinitions } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const config = createInitialInvitation();
  config.hero.type = "interactive";
  config.sections.push(createSection("countdown"), createSection("glimpse"));
  assert.equal(createSection("countdown").fields.time, "18:30");

  assert.equal(sectionDefinitions.countdown.price, 150);
  assert.equal(sectionDefinitions.glimpse.price, 200);
  const defaultSpecialMessage = createSection("special-message");
  assert.equal(defaultSpecialMessage.title, "A Special Message");
  assert.doesNotMatch(JSON.stringify(defaultSpecialMessage), /grandparent|remembered|memory/i);
  assert.equal(getCoupleInitials("  Salma", "Sam"), "S ♥ S");
  assert.equal(getCoupleInitials("123 Aisha", " Noor"), "A ♥ N");
  const basicUrls = new Set(Object.values(heroPresets).flat().map((preset) => preset.url));
  assert.ok(interactiveHeroPresets.every((preset) => !basicUrls.has(preset.url)));
  const versionedAssetUrls = [
    ...basicUrls,
    ...interactiveHeroPresets.map((preset) => preset.url),
    ...Object.values(interactiveFrameAssets),
    ...Object.values(bismillahAssets),
    ...Object.values(openingAssets).flatMap((assets) => assets.flatMap((asset) => Object.values(asset.urls))),
  ];
  assert.ok(versionedAssetUrls.every((url) => url.endsWith(`?v=${invitationAssetVersion}`)));
  assert.deepEqual(calculateInvitationPrice(config), {
    base: 1000,
    opening: 0,
    hero: 200,
    sections: 350,
    total: 1550,
  });
});

test("protects mobile preview interactions and layout regressions", async () => {
  const [designer, preview, customRenderer, styles, setupPage, examplePage] = await Promise.all([
    readFile(new URL("../components/designer/invitation-designer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/invitation-preview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/custom-section-renderer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/design-invitation/invitation.css", import.meta.url), "utf8"),
    readFile(new URL("../app/examples/[slug]/setup/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/examples/[slug]/page.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(designer, /function choosePalette\(id: PaletteId\) \{\s*updateConfig\(\(current\) => \(\{ \.\.\.current, palette: id \}\)\);\s*\}/);
  assert.match(preview, /touchedRef\.current\.size \/ eligibleCells >= \.75/);
  assert.doesNotMatch(preview, /images\.slice\(0, 6\)/);
  assert.doesNotMatch(preview, /preview-envelope-seal-blank/);
  assert.doesNotMatch(preview, /invite-preview-monogram/);
  assert.match(styles, /\.designer-steps \{\s*position: relative;[\s\S]*?width: 100%/);
  assert.doesNotMatch(styles, /\.designer-header \{[^}]*border-bottom/);
  assert.match(styles, /\.designer-preview-panel \{ position: sticky; top: clamp\(2\.5rem,calc\(\(100vh - 50rem\) \/ 2\),6rem\)/);
  assert.match(styles, /\.designer-step-card\.designer-main-step \{[^}]*overflow: visible/);
  assert.match(styles, /\.designer-page \{[\s\S]*?overflow-x: clip/);
  assert.match(styles, /\.designer-table-grid \{[^}]*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.designer-add-item \{ width: 100%/);
  assert.match(styles, /@keyframes preview-invitation-petal/);
  assert.doesNotMatch(styles, /@keyframes preview-footer-wave/);
  assert.match(designer, /activatePreview\(section\.id\)/);
  assert.match(designer, /sectionMoveAnchor/);
  assert.match(designer, /window\.scrollBy\(\{ top: topDifference, left: 0, behavior: "instant" \}\)/);
  assert.match(designer, /focus\(\{ preventScroll: true \}\)/);
  assert.match(preview, /getCountdownParts\(section\.fields\.date, section\.fields\.time\)/);
  assert.match(designer, /function MainStep/);
  assert.match(designer, /step\.open = true/);
  assert.match(designer, /case "special-message":[\s\S]*?Small text above the heading[\s\S]*?\{headingField\}[\s\S]*?Your main message/);
  assert.doesNotMatch(styles, /designer-choice\.is-featured/);
  assert.match(styles, /\.preview-event-card \{ width: min\(16\.5rem,100%\)/);
  assert.match(styles, /\.preview-message \{[^}]*display: flex;[^}]*align-items: center;[^}]*justify-content: center/);
  assert.match(styles, /\.preview-memory-card \{[^}]*width: 100%;[^}]*max-width: 100%;[^}]*margin-inline: auto/);
  assert.match(styles, /\.preview-direction-options \{[^}]*grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.preview-table-list \{[^}]*grid-template-columns: repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.designer-preview-price \{/);
  assert.match(styles, /\.designer-opening-thumb \{ height: auto; aspect-ratio: 2 \/ 3/);
  assert.match(styles, /\.invite-preview-hero-shade::after \{ content: none/);
  assert.match(styles, /\.invite-preview-bismillah img \{[^}]*brightness\(0\) invert\(1\)/);
  assert.match(styles, /@keyframes preview-sparkle-burst/);
  assert.match(designer, /pattern="5\[0-9\]\{7\}"/);
  assert.doesNotMatch(designer, /setNotice/);
  assert.doesNotMatch(preview, /preview-envelope-seam/);
  assert.match(preview, /focusTarget === "opening" \|\| focusTarget === "bismillah"/);
  assert.match(preview, /formatDate\(config\.hero\.date\)/);
  assert.match(preview, /String\(hours\)\.padStart\(2, "0"\)/);
  assert.doesNotMatch(preview, /With love, always|Remembering with gratitude|Forever remembered/);
  assert.match(designer, /designer-photo-remove/);
  assert.match(designer, /Small dedication label/);
  assert.match(designer, /Closing words/);
  assert.match(styles, /@keyframes designer-petal-fall/);
  assert.match(designer, /preparePhotosForSave/);
  assert.match(designer, /URL\.createObjectURL\(preview\)/);
  assert.match(designer, /max 5 MB/);
  assert.doesNotMatch(designer, /20 MB/);
  assert.match(preview, /data-photo-count=\{section\.images\.length\}/);
  assert.match(styles, /data-photo-count="1"/);
  assert.match(designer, /designer-photo-inline-progress/);
  assert.doesNotMatch(designer, /designer-photo-save-progress/);
  assert.match(styles, /\.designer-photo-inline-progress \{[^}]*margin-left: auto/);
  assert.match(designer, /setNewlyAddedSectionId\(section\.id\)/);
  assert.match(designer, /setNewlyAddedSectionId\(copy\.id\)/);
  assert.match(designer, /openWhenAdded=\{newlyAddedSectionId === section\.id\}/);
  assert.match(designer, /useState\(readOnlyMode \|\| openWhenAdded \|\| \(defaultOpen/);
  assert.match(designer, /window\.matchMedia\("\(max-width: 900px\)"\)\.matches/);
  assert.match(designer, /setIsOpen\(mobileInitialOpen\.current\)/);
  assert.doesNotMatch(designer, /querySelectorAll<HTMLDetailsElement>\("#designer-sections \.designer-section-editor"\)/);
  assert.doesNotMatch(setupPage, /DesignerMobileEnhancements|dynamic\(|React\.lazy/);
  assert.match(setupPage, /export const dynamic = "force-dynamic"/);
  assert.match(setupPage, /export const revalidate = 0/);
  assert.match(setupPage, /robots: \{ index: false, follow: false \}/);
  assert.match(examplePage, /href=\{`\/examples\/\$\{example\.slug\}\/setup`\} prefetch=\{false\}/);
  assert.match(customRenderer, /customSectionPreviewDebounceMs = 250/);
  assert.match(customRenderer, /window\.setTimeout/);
  assert.match(customRenderer, /window\.requestAnimationFrame/);
  assert.match(customRenderer, /Math\.abs\(difference\) <= customSectionHeightTolerance/);
  assert.match(customRenderer, /resizeObserverRef\.current\?\.disconnect\(\)/);
  assert.match(customRenderer, /window\.cancelAnimationFrame/);
  assert.match(customRenderer, /observedDocumentRef\.current !== document/);
  assert.match(customRenderer, /guard\.streak > 4/);
  assert.doesNotMatch(customRenderer, /new ResizeObserver\(syncHeight\)|window\.addEventListener\(["']error/);
});

test("example invitations are data-driven, varied, and priced by the shared calculator", async () => {
  const [{ invitationExamples, getInvitationExampleCards, getInvitationExamplePrice }, { calculateInvitationPrice, includedSectionTypes }, { isInvitationConfig }] = await Promise.all([
    vite.ssrLoadModule("/lib/invitation-examples.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
    vite.ssrLoadModule("/lib/invitation-validation.ts"),
  ]);

  assert.equal(invitationExamples.length, 10);
  assert.equal(new Set(invitationExamples.map((example) => example.slug)).size, 10);
  assert.deepEqual(new Set(invitationExamples.map((example) => example.config.palette)), new Set(["beige", "olive", "dusty-blue", "burgundy", "pink", "lilac"]));
  assert.ok(new Set(invitationExamples.map((example) => example.config.opening.type)).size >= 3);
  assert.ok(invitationExamples.some((example) => example.config.hero.type === "interactive"));
  assert.ok(invitationExamples.some((example) => example.config.hero.type === "basic"));
  assert.ok(invitationExamples.some((example) => example.config.sections.some((section) => section.type === "glimpse" && section.images.length >= 4)));

  const seatingCounts = [];
  const specialMessageTitles = new Set();
  const nikkahVenues = [];
  const eventRank = (name) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("mehendi")) return 1;
    if (normalized.includes("nikkah") || normalized.includes("nikah")) return 2;
    if (normalized.includes("thank you")) return 5;
    if (normalized.includes("walimah") || normalized.includes("dinner")) return 3;
    if (normalized.includes("chawtari")) return 4;
    return 99;
  };

  for (const example of invitationExamples) {
    assert.ok(isInvitationConfig(example.config), `${example.slug} should be a valid invitation config`);
    assert.equal(getInvitationExamplePrice(example), calculateInvitationPrice(example.config).total);
    assert.ok(includedSectionTypes.every((type) => example.config.sections.some((section) => section.type === type && section.included)));
    assert.ok(example.thumbnail.startsWith("/images/examples/"));

    const details = example.config.sections.find((section) => section.type === "event-details");
    assert.ok(details, `${example.slug} should include event details`);
    const ranks = details.items.map((item) => eventRank(item.name ?? ""));
    assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), `${example.slug} event details should follow the Mauritian wedding sequence`);
    const timestamps = details.items.map((item) => `${item.date ?? ""}T${item.time || "00:00"}`);
    assert.deepEqual(timestamps, [...timestamps].sort(), `${example.slug} event details should be chronological`);
    nikkahVenues.push(...details.items.filter((item) => /nik+ah/i.test(item.name ?? "")).map((item) => item.venue ?? ""));

    const timelineSection = example.config.sections.find((section) => section.type === "journey");
    assert.ok(timelineSection, `${example.slug} should include a timeline`);
    const timelineRanks = timelineSection.items.map((item) => eventRank(item.title ?? ""));
    assert.deepEqual(timelineRanks, [...timelineRanks].sort((a, b) => a - b), `${example.slug} timeline should follow the Mauritian wedding sequence`);
    assert.deepEqual(timelineRanks, ranks, `${example.slug} timeline and event details should list the same event sequence`);
    const timelineDates = timelineSection.items.map((item) => {
      const humanDate = (item.date ?? "").split("·")[0].trim();
      const timestamp = Date.parse(`${humanDate} UTC`);
      assert.ok(Number.isFinite(timestamp), `${example.slug} should use readable timeline dates`);
      return new Date(timestamp).toISOString().slice(0, 10);
    });
    assert.deepEqual(timelineDates, details.items.map((item) => item.date), `${example.slug} timeline and event details dates should agree`);

    for (const section of example.config.sections.filter((item) => item.type === "day-programme")) {
      assert.notEqual(section.title, "Day Programme");
      assert.match(section.title, /Mehendi|Nikkah|Walimah|Dinner|Chawtari/i);
    }
    for (const section of example.config.sections.filter((item) => item.type === "seating")) seatingCounts.push(section.items.length);
    for (const section of example.config.sections.filter((item) => item.type === "special-message")) specialMessageTitles.add(section.title);
  }

  assert.ok(nikkahVenues.some((venue) => /masjid|mosque|quran house/i.test(venue)), "some Nikkahs should take place at mosques");
  assert.ok(nikkahVenues.some((venue) => !/masjid|mosque|quran house/i.test(venue)), "not every Nikkah should take place at a mosque");
  assert.ok(seatingCounts.some((count) => count >= 10 && count <= 12), "an example should show 10–12 tables");
  assert.ok(seatingCounts.some((count) => count >= 15), "an example should show at least 15 tables");
  assert.ok(specialMessageTitles.size >= 3, "special messages should demonstrate several purposes");

  const cards = getInvitationExampleCards();
  assert.equal(cards.length, invitationExamples.length);
  assert.deepEqual(cards.map((card) => card.price), invitationExamples.map((example) => calculateInvitationPrice(example.config).total));
  assert.ok(new Set(cards.map((card) => card.price)).size >= 5);
});

test("example mode labels every invitation part without affecting normal invitations", async () => {
  const [{ PublishedInvitation }, { getInvitationExample, invitationExamples }] = await Promise.all([
    vite.ssrLoadModule("/components/invitation/invitation-preview.tsx"),
    vite.ssrLoadModule("/lib/invitation-examples.ts"),
  ]);
  const example = getInvitationExample("olive-serenity");
  assert.ok(example);

  const demoHtml = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: example.config, exampleMode: true }));
  const normalHtml = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: example.config }));
  const labelCount = (demoHtml.match(/class="example-section-label/g) ?? []).length;

  assert.equal(labelCount, example.config.sections.length + 2); // opening, hero and configured sections
  assert.match(demoHtml, /Section · Opening · Envelope/);
  assert.match(demoHtml, /Section · Main Area · Interactive Hero/);
  assert.match(demoHtml, /Section · Glimpse Of Us/);
  assert.doesNotMatch(demoHtml, /Section · Footer/);
  assert.match(demoHtml, /maps\.apple\.com/);
  assert.match(demoHtml, /www\.waze\.com/);
  assert.match(demoHtml, /www\.google\.com\/maps\/dir/);
  assert.doesNotMatch(normalHtml, /example-section-label|Section · Main Area/);

  for (const invitation of invitationExamples) {
    const invitationHtml = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: invitation.config, exampleMode: true }));
    const labels = (invitationHtml.match(/class="example-section-label/g) ?? []).length;
    const expectedLabels = invitation.config.sections.length + 1 + (invitation.config.opening.type === "none" ? 0 : 1);
    assert.equal(labels, expectedLabels, `${invitation.slug} should label every rendered example section`);
    assert.doesNotMatch(invitationHtml, /Section · Footer/);
  }
});

test("the existing designer renders exact example settings in a locked read-only mode", async () => {
  const [{ InvitationDesigner }, { getInvitationExample, getInvitationExamplePrice }, readOnlyStyles, designerStyles] = await Promise.all([
    vite.ssrLoadModule("/components/designer/invitation-designer.tsx"),
    vite.ssrLoadModule("/lib/invitation-examples.ts"),
    readFile(new URL("../app/examples/examples.css", import.meta.url), "utf8"),
    readFile(new URL("../app/design-invitation/invitation.css", import.meta.url), "utf8"),
  ]);
  const example = getInvitationExample("burgundy-romance");
  assert.ok(example);
  const html = renderToStaticMarkup(React.createElement(InvitationDesigner, {
    exampleConfig: example.config,
    exampleName: example.name,
    exampleSlug: example.slug,
  }));

  assert.match(html, /Read-only design setup/);
  assert.match(html, /View-only example/);
  assert.match(html, /<fieldset class="designer-mode-fields" disabled="" aria-label="Read-only invitation settings"/);
  assert.match(html, /Ayesha/);
  assert.match(html, /Hamza/);
  assert.match(html, /Mehendi/);
  assert.match(html, new RegExp(`Rs ${getInvitationExamplePrice(example).toLocaleString("en-US")}`));
  assert.match(html, /href="\/examples\/burgundy-romance"/);
  assert.doesNotMatch(html, /Save my design|How can we contact you\?|Mauritian phone or WhatsApp number/);
  assert.match(designerStyles, /\.designer-mode-fields \{[^}]*margin: 0;[^}]*padding: 0;[^}]*border: 0/);
  assert.match(designerStyles, /\.designer-main-step > summary:focus-visible \{/);
  assert.match(readOnlyStyles, /\.designer-readonly \.designer-mode-fields\[disabled\],[\s\S]*?opacity: 1/);
  assert.match(readOnlyStyles, /\.designer-readonly \.designer-mode-fields\[disabled\] button,[\s\S]*?cursor: not-allowed/);
  assert.match(readOnlyStyles, /\.designer-readonly \.designer-field input:disabled,[\s\S]*?background: #fff/);
  assert.doesNotMatch(readOnlyStyles, /grayscale\(|opacity: \.82|#e9e6e4/);
  assert.doesNotMatch(readOnlyStyles, /\.designer-readonly[^{}]*\{[^}]*filter:/);
  assert.doesNotMatch(readOnlyStyles, /\.designer-readonly \.designer-preview-panel/);
});

test("example photographs use compact WebP files and dedicated landing thumbnails", async () => {
  const full = ["olive-garden.webp", "burgundy-henna.webp", "dusty-blue-hall.webp", "lilac-garden.webp"];
  const thumbs = [
    "ivory-promise.webp",
    "olive-serenity.webp",
    "dusty-blue-elegance.webp",
    "burgundy-romance.webp",
    "blush-reverie.webp",
    "lavender-whispers.webp",
    "pearl-garden.webp",
    "midnight-bloom.webp",
    "golden-nikkah.webp",
    "lilac-moonlight.webp",
  ];
  const photoDirectory = new URL("../public/examples/photos/", import.meta.url);
  const thumbnailDirectory = new URL("../public/examples/thumbnails/", import.meta.url);
  const fullStats = await Promise.all(full.map((name) => stat(new URL(name, photoDirectory))));
  const thumbStats = await Promise.all(thumbs.map((name) => stat(new URL(name, thumbnailDirectory))));
  assert.ok(fullStats.every((item) => item.size < 250_000));
  assert.ok(thumbStats.every((item) => item.size < 80_000));
});

test("long couple names use measured shared sizing and wrap only at spaces", async () => {
  const [{ PublishedInvitation, calculateFittedNameSize }, { createInitialInvitation }, styles, publishedStyles, previewSource] = await Promise.all([
    vite.ssrLoadModule("/components/invitation/invitation-preview.tsx"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
    readFile(new URL("../app/design-invitation/invitation.css", import.meta.url), "utf8"),
    readFile(new URL("../app/[slug]/published-invitation.css", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/invitation-preview.tsx", import.meta.url), "utf8"),
  ]);
  const config = createInitialInvitation();
  config.hero.firstName = "MichaelJohn";
  config.hero.secondName = "AlexandraRose";
  const html = renderToStaticMarkup(React.createElement(PublishedInvitation, { config }));
  assert.match(html, /data-name-fit="long"/);
  assert.match(html, /data-name-autofit="width"/);
  assert.match(html, /class="invite-preview-person-name">MichaelJohn/);
  assert.match(styles, /h2\[data-name-fit="long"\]/);
  assert.match(styles, /\.invite-preview-person-name \{[^}]*white-space: normal;[^}]*overflow-wrap: normal;[^}]*word-break: normal;[^}]*hyphens: none/);
  assert.match(styles, /h2\[data-name-fit="extra-long"\]/);
  assert.match(publishedStyles, /h2\[data-name-fit="standard"\]/);
  assert.equal(calculateFittedNameSize(48, 280, 360), 35.84);
  assert.equal(calculateFittedNameSize(48, 280, 240), null);
  assert.match(previewSource, /new ResizeObserver\(fitToAvailableWidth\)/);
  assert.match(previewSource, /name\.trim\(\)\.split\(\/\\s\+\/u\)/);
  assert.match(previewSource, /fontSize: `\$\{fontSize\}px`/);
});

test("renders the private order dashboard shell without a public login", async () => {
  const { InvitationDashboard: Dashboard } = await vite.ssrLoadModule("/components/dashboard/invitation-dashboard.tsx");
  const html = renderToStaticMarkup(React.createElement(Dashboard));
  assert.match(html, /Order desk/);
  assert.match(html, /Need your review/);
  assert.match(html, /Currently live/);
  assert.match(html, /Previous orders/);
  assert.match(html, /Order value/);
  assert.match(html, /Search names, phone or link/);
  assert.doesNotMatch(html, /Your invitation orders/);
  assert.doesNotMatch(html, /Mauritius date/);
  assert.doesNotMatch(html, /Login|Log in|Sign in/);
});

test("renders admin orders in the shared designer with collapsed editing steps", async () => {
  const [{ InvitationDesigner }, { createInitialInvitation }, { summarizeOrder }] = await Promise.all([
    vite.ssrLoadModule("/components/designer/invitation-designer.tsx"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
    vite.ssrLoadModule("/lib/invitation-orders.ts"),
  ]);
  const config = createInitialInvitation();
  config.contact = { name: "Aisha Rahman", phone: "58749327" };
  const record = {
    id: "11111111-1111-4111-8111-111111111111",
    status: "pending",
    slug: "aisha-and-rayan",
    active_until: null,
    total_price: 1400,
    created_at: "2026-09-12T08:15:00Z",
    deployed_at: null,
    inactive_at: null,
    config,
  };
  const html = renderToStaticMarkup(React.createElement(InvitationDesigner, { adminOrder: { ...record, summary: summarizeOrder(record) }, today: "2026-09-12" }));
  assert.match(html, /Edit invitation/);
  assert.match(html, /The details that matter most/);
  assert.match(html, /Invitation link/);
  assert.match(html, /https:\/\/www\.paperless-invites\.com\/aisha-and-rayan/);
  assert.match(html, /Order price \(Rs\)/);
  assert.match(html, /Save edits/);
  assert.match(html, /Preview saved invitation/);
  assert.match(html, /\/dashboard\/preview\/11111111-1111-4111-8111-111111111111/);
  assert.doesNotMatch(html, /designer-step-card designer-main-step[^>]*open=/);
  const copyRecord = { ...record, slug: "john-and-sameer-copy" };
  const copyHtml = renderToStaticMarkup(React.createElement(InvitationDesigner, { adminOrder: { ...copyRecord, summary: summarizeOrder(copyRecord) }, today: "2026-09-12" }));
  assert.match(copyHtml, /https:\/\/www\.paperless-invites\.com\/john-and-sameer-copy/);
  const liveRecord = { ...record, status: "active", active_until: "2027-09-12", deployed_at: "2026-09-12T09:00:00Z" };
  const liveHtml = renderToStaticMarkup(React.createElement(InvitationDesigner, { adminOrder: { ...liveRecord, summary: summarizeOrder(liveRecord) }, today: "2026-09-12" }));
  assert.match(liveHtml, /Update live invitation/);
  assert.doesNotMatch(liveHtml, />Save edits</);
  assert.doesNotMatch(liveHtml, /Preview saved invitation/);
  assert.match(liveHtml, /Undeploy/);
  assert.match(liveHtml, /Send .* the invitation link on WhatsApp/);
  assert.equal((liveHtml.match(/Update live invitation</g) ?? []).length, 1);
});

test("live desktop invitations match the centred private preview while mobile still fills the viewport", async () => {
  const [css, designerCss, templateCss, { PublishedInvitation }, { createInitialInvitation }] = await Promise.all([
    readFile(new URL("../app/[slug]/published-invitation.css", import.meta.url), "utf8"),
    readFile(new URL("../app/design-invitation/invitation.css", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/templates/coastal-reverie.module.css", import.meta.url), "utf8"),
    vite.ssrLoadModule("/components/invitation/invitation-preview.tsx"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const html = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: createInitialInvitation() }));
  assert.match(html, /class="published-invitation"/);
  assert.match(html, /designer-phone-screen published-invitation-screen/);
  assert.match(css, /\.published-invitation-screen\s*\{[^}]*width: 100%;[^}]*height: auto;[^}]*overflow: visible;/);
  assert.match(css, /@media \(min-width: 48rem\)/);
  assert.match(css, /\.published-invitation-screen \{ width: min\(30rem,100%\); min-width: 0;/);
  assert.match(css, /\.published-invitation \.preview-opening \{ position: absolute; inset: 0; width: 100%;/);
  assert.doesNotMatch(css, /\.published-invitation:not\(\.is-private\)/);
  assert.match(css, /font-size: clamp\(4\.5rem, 26vw, 7rem\)/);
  assert.match(css, /\.published-invitation \.invite-preview-hero-image \{ scale: 1;/);
  assert.match(css, /\.published-invitation \.preview-gallery \{ width: min\(100%,18\.25rem\); max-width: 18\.25rem; \}/);
  assert.doesNotMatch(css, /\.published-invitation \.preview-gallery \{ max-width: 29rem; \}/);
  assert.match(css, /calc\(100vw \* 656 \/ 333\)/);
  const privateCss = await readFile(new URL("../app/dashboard/preview.css", import.meta.url), "utf8");
  assert.match(privateCss, /\.admin-private-preview \.published-invitation-screen \{ width: min\(30rem,100%\)/);
  assert.match(designerCss, /\.designer-phone-screen \{[^}]*height: clamp\(22rem/);
  assert.match(designerCss, /\.journey-timeline article p \{[^}]*italic \.98rem\/1\.75/);
  assert.match(designerCss, /\.designer-header \.designer-back \{[^}]*display: inline-flex/);
  assert.match(designerCss, /\.designer-steps \{ width: 100%; margin: 0 0 \.8rem; grid-template-columns: repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(designerCss, /\.designer-opening-images \{ grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
  // Use Template 1's full-image veil and text shadow, without a visible oval behind the text.
  assert.match(templateCss, /\.heroVeil \{[^}]*rgba\(58,41,29,\.32\)/);
  assert.match(designerCss, /\.invite-preview-hero-shade \{[^}]*rgba\(58,41,29,\.32\)/);
  assert.doesNotMatch(designerCss, /\.invite-preview-hero-copy::before \{/);
  assert.doesNotMatch(designerCss, /\.interactive-hero-copy::before \{/);
});

test("deployment modal remains readable and every WhatsApp contact uses the WhatsApp glyph", async () => {
  const [styles, dashboard, designer, sharedIcon, landing] = await Promise.all([
    readFile(new URL("../app/dashboard/dashboard.css", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/invitation-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/designer/invitation-designer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/shared/whatsapp-icon.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/landing/pricing-section.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(styles, /\.orders-deploy-modal \{[^}]*max-height: calc\(100dvh - 1\.5rem\)/);
  assert.match(styles, /\.orders-deploy-modal \.orders-deploy-actions \{[^}]*repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.orders-deploy-modal \.orders-deploy-actions\.has-whatsapp \{ grid-template-columns: repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.orders-deploy-modal \.orders-deploy-actions\.has-whatsapp a\.is-whatsapp \{ min-height: 3rem;/);
  assert.match(styles, /\.orders-deploy-link > button span \{[^}]*overflow-wrap: anywhere/);
  assert.match(dashboard, /import \{ WhatsAppIcon \}/);
  assert.match(designer, /import \{ WhatsAppIcon \}/);
  assert.doesNotMatch(designer, /MessageCircle/);
  assert.match(sharedIcon, /export function WhatsAppIcon/);
  assert.match(landing, /SocialIconLink href=\{links\.customPartWhatsApp\} label="WhatsApp"/);
});

test("the dashboard has mobile cards, expiring feedback, and a WhatsApp publishing action", async () => {
  const [css, dashboard] = await Promise.all([
    readFile(new URL("../app/dashboard/dashboard.css", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/invitation-dashboard.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*?\.orders-datatable tbody tr \{[^}]*display: grid/);
  assert.match(css, /\.orders-datatable td::before \{ content: attr\(data-label\)/);
  assert.match(dashboard, /data-label="Actions"/);
  assert.match(dashboard, /setActionNotice\(""\); \}, 5000\)/);
  assert.match(dashboard, /<span>WhatsApp<\/span>/);
  assert.match(dashboard, /customerWhatsAppUrl\(order\.phone/);
  assert.match(css, /\.order-danger-action\.is-undeploy svg:not\(\.is-spinning\)/);
  assert.match(css, /a\.is-whatsapp > svg \{ width: \.78rem; min-width: \.78rem; max-width: \.78rem; height: \.78rem/);
});

test("duplicates review orders with independent photo storage and an atomic DB commit", async () => {
  const [{ POST }, { createInitialInvitation, createSection }] = await Promise.all([
    vite.ssrLoadModule("/app/api/dashboard/orders/route.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const originalId = "11111111-1111-4111-8111-111111111111";
  const storageOrigin = "https://test-project.supabase.co";
  const oldUrl = `${storageOrigin}/storage/v1/object/public/invitation-media/${originalId}/photo.jpg`;
  const config = createInitialInvitation();
  config.hero.firstName = "John";
  config.hero.secondName = "Sameer";
  config.hero.type = "interactive";
  config.hero.photoSource = "uploaded";
  config.hero.uploadedUrl = oldUrl;
  const gallery = createSection("glimpse");
  gallery.images = [oldUrl];
  config.sections.push(gallery);
  const original = { id: originalId, revision: 1, status: "pending", slug: "custom-link", active_until: null, total_price: 1730, created_at: "2026-09-12T08:15:00Z", deployed_at: null, inactive_at: null, config };
  const existingFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = storageOrigin;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  const posts = [];
  let failAtomicCommit = false;
  const response = (value, status = 200) => Response.json(value, { status });
  const endpoint = "/api/dashboard/orders";
  try {
    globalThis.fetch = async (input, init = {}) => {
      const url = String(input);
      if (providerSecurity(url)) return providerSecurity(url);
      if (url.includes("/rest/v1/invitations?") && (!init.method || init.method === "GET")) {
        if (new URL(url).searchParams.get("select") === "id") return response([]);
        return new URL(url).searchParams.get("id") === `eq.${originalId}` || !new URL(url).searchParams.has("id") ? response([original]) : response([]);
      }
      if (url.includes("/rest/v1/invitation_media?") && (!init.method || init.method === "GET")) {
        return response([{ storage_path: `${originalId}/photo.jpg`, public_url: oldUrl, slot: "hero", mime_type: "image/png", size_bytes: fixturePng.length }]);
      }
      if (url === oldUrl) return new Response(fixturePng, { status: 200 });
      if (init.method === "POST" && url.includes("/storage/v1/object/invitation-media/")) {
        posts.push({ type: "photo", url });
        return response({});
      }
      if (init.method === "POST" && url.endsWith("/rest/v1/rpc/create_invitation_with_media")) {
        const values = JSON.parse(init.body);
        posts.push({ type: "atomic", values });
        return failAtomicCommit ? response({ message: "Insert failed" }, 500) : response([{ ...original, id: values.p_id, slug: values.p_slug, config: values.p_config, total_price: values.p_total_price }], 201);
      }
      if (init.method === "DELETE" && url.includes("/rest/v1/invitations?")) {
        posts.push({ type: "order-rollback", url });
        return response({});
      }
      if (init.method === "DELETE" && url.endsWith("/storage/v1/object/invitation-media")) {
        posts.push({ type: "photo-rollback", values: JSON.parse(init.body) });
        return response({});
      }
      throw new Error(`Unexpected fetch: ${init.method ?? "GET"} ${url}`);
    };

    const duplicated = await POST(apiRequest(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    assert.equal(duplicated.status, 201);
    const { order } = await duplicated.json();
    assert.equal(order.status, "pending");
    assert.match(order.slug, /^john-and-sameer-copy-[a-f0-9]{32}$/);
    assert.equal(order.total_price, 1730);
    assert.notEqual(order.id, originalId);
    assert.deepEqual(posts.map((item) => item.type), ["photo", "atomic"]);
    const photoUrl = posts[1].values.p_media[0].public_url;
    assert.match(photoUrl, /\/media-[a-f0-9]{64}\//);
    assert.equal(posts[1].values.p_config.hero.uploadedUrl, photoUrl);
    assert.equal(order.config.hero.uploadedUrl, photoUrl);
    assert.equal(posts[1].values.p_config.sections.at(-1).images[0], photoUrl);
    assert.match(posts[1].values.p_media[0].storage_path, /^media-[a-f0-9]{64}\//);
    assert.notEqual(photoUrl, oldUrl);

    original.status = "active";
    const denied = await POST(apiRequest(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    assert.equal(denied.status, 409);
    assert.equal(posts.length, 2);

    original.status = "pending";
    failAtomicCommit = true;
    const previousConsoleError = console.error;
    const expectedErrors = [];
    let unsuccessful;
    try {
      console.error = (...args) => expectedErrors.push(args);
      unsuccessful = await POST(apiRequest(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    } finally {
      console.error = previousConsoleError;
    }
    assert.match(expectedErrors[0][0], /Unable to duplicate invitation order/);
    assert.equal(unsuccessful.status, 503);
    assert.deepEqual(posts.slice(2).map((item) => item.type), ["photo", "atomic", "photo-rollback"]);
    assert.deepEqual(posts[4].values.prefixes, [posts[3].values.p_media[0].storage_path]);

    original.slug = null;
    failAtomicCommit = false;
    const withoutSlug = await POST(apiRequest(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    assert.equal(withoutSlug.status, 201);
    assert.match((await withoutSlug.json()).order.slug, /^john-and-sameer-copy-[a-f0-9]{32}$/);
  } finally {
    globalThis.fetch = existingFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("legacy name-bearing media folders remain valid for existing invitations", async () => {
  const { belongsToOrder } = await vite.ssrLoadModule("/lib/invitation-media-path.ts");
  const id = "11111111-1111-4111-8111-111111111111";
  assert.ok(belongsToOrder(`john-and-sameer-copy-${id}-elodie-aamir/hero:0-example.webp`, id));
  assert.ok(belongsToOrder(`${id}/old-photo.jpg`, id));
  assert.ok(belongsToOrder(`${id}-elodie-aamir-john-and-sameer-copy/previous-photo.webp`, id));
  assert.equal(belongsToOrder("different-id/photo.jpg", id), false);
});

test("administrator photo uploads keep names and order IDs out of public paths", async () => {
  const [{ POST }, { createInitialInvitation }] = await Promise.all([
    vite.ssrLoadModule("/app/api/dashboard/orders/media/route.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const id = "11111111-1111-4111-8111-111111111111";
  const config = createInitialInvitation();
  config.contact.name = "Previously Saved Customer";
  const order = { id, revision: 1, status: "pending", slug: "previous-link", active_until: null, total_price: 1000, created_at: "2026-09-15T00:00:00Z", deployed_at: null, inactive_at: null, config };
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  let storedAt = "";
  try {
    globalThis.fetch = async (input, init = {}) => {
      const endpoint = String(input);
      if (providerSecurity(endpoint)) return providerSecurity(endpoint);
      if (endpoint.includes("/rest/v1/invitations?") && (!init.method || init.method === "GET")) return Response.json([order]);
      if (init.method === "POST" && endpoint.includes("/storage/v1/object/invitation-media/")) {
        storedAt = endpoint;
        return Response.json({});
      }
      throw new Error(`Unexpected ${init.method ?? "GET"} request: ${endpoint}`);
    };
    const form = new FormData();
    form.set("invitationId", id);
    form.set("slot", "hero:0");
    form.set("link", "Current Custom Link");
    form.set("customerName", "Élodie Aamir");
    form.set("file", new File([fixturePng], "portrait.png", { type: "image/png" }));
    const response = await POST(apiRequest("https://localhost/api/dashboard/orders/media", { method: "POST", body: form }));
    assert.equal(response.status, 201);
    const photo = await response.json();
    assert.match(photo.path, /^media-[a-f0-9]{64}\/[a-f0-9-]+\.png$/);
    assert.ok(!photo.path.includes(id));
    assert.ok(storedAt.endsWith(photo.path));
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("administrator upload requests omit customer and link identity", async () => {
  const { uploadPendingPhotos } = await vite.ssrLoadModule("/lib/photo-upload.ts");
  const file = new File([fixturePng], "portrait.png", { type: "image/png" });
  const pending = { hero: [file] };
  const prepared = new Map([[file, file]]);
  const uploaded = new Map();
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_input, init) => {
      assert.equal(init.body.has("link"), false);
      assert.equal(init.body.has("customerName"), false);
      return Response.json({ url: "https://example.com/photo.webp", path: "current-link/id/current.webp", slot: "hero:0", mimeType: "image/webp", sizeBytes: 5, receipt: "signed" }, { status: 201 });
    };
    await uploadPendingPhotos("order-id", pending, "/api/dashboard/orders/media", prepared, uploaded);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retries an interrupted batch without uploading successful files again and explains plain-text 413", async () => {
  const { maxOriginalImageBytes, preparePhotoPreview, uploadPendingPhotos } = await vite.ssrLoadModule("/lib/photo-upload.ts");
  assert.equal(maxOriginalImageBytes, 5 * 1024 * 1024);
  const previewFile = new File(["preview"], "preview.jpg", { type: "image/jpeg" });
  assert.equal(await preparePhotoPreview(previewFile), previewFile);
  const files = [new File(["one"], "one.jpg", { type: "image/jpeg" }), new File(["two"], "two.jpg", { type: "image/jpeg" })];
  const pending = { "section:glimpse-included:images": files };
  const prepared = new Map();
  const uploaded = new Map();
  files.forEach((file) => prepared.set(file, file));
  const originalFetch = globalThis.fetch;
  let requests = 0;
  try {
    globalThis.fetch = async (_url, init) => {
      requests += 1;
      assert.equal(init.body.get("file").name, files[requests - 1].name);
      return requests === 2
        ? new Response("Payload Too Large", { status: 413 })
        : Response.json({ url: `https://example.com/photo-${requests}.jpg`, path: `folder/photo-${requests}.jpg`, slot: "section:glimpse-included:images:0", mimeType: "image/jpeg", sizeBytes: 3, receipt: "signed" }, { status: 201 });
    };
    await assert.rejects(uploadPendingPhotos("order", pending, "/api/invitations/media", prepared, uploaded, "secret"), /two\.jpg exceeded the upload limit/);
    assert.equal(uploaded.get("section:glimpse-included:images:0").url, "https://example.com/photo-1.jpg");
    globalThis.fetch = async () => { requests += 1; return Response.json({ url: "https://example.com/photo-2.jpg", path: "folder/photo-2.jpg", slot: "section:glimpse-included:images:1", mimeType: "image/jpeg", sizeBytes: 3, receipt: "signed" }, { status: 201 }); };
    const result = await uploadPendingPhotos("order", pending, "/api/invitations/media", prepared, uploaded, "secret");
    assert.deepEqual(result["section:glimpse-included:images"], ["https://example.com/photo-1.jpg", "https://example.com/photo-2.jpg"]);
    assert.equal(requests, 3);
  } finally { globalThis.fetch = originalFetch; }
});

test("a failed six-photo submission creates no invitation or media rows and durably stages images for cleanup", async () => {
  const [{ POST: beginOrFinalize }, { POST: upload }, { createInitialInvitation, createSection }] = await Promise.all([
    vite.ssrLoadModule("/app/api/invitations/route.ts"),
    vite.ssrLoadModule("/app/api/invitations/media/route.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const config = createInitialInvitation();
  config.contact = { name: "John Client", phone: "58749327" };
  const section = createSection("glimpse");
  config.sections.push(section);
  const slots = Array.from({ length: 6 }, (_, index) => `section:${section.id}:images:${index}`);
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  let uploadCount = 0;
  let dbCommits = 0;
  let lastCommit = null;
  let committedId = "";
  let removed = [];
  try {
    globalThis.fetch = async (input, init = {}) => {
      const url = String(input);
      if (providerSecurity(url)) return providerSecurity(url);
      if (url.includes("/rest/v1/invitations?")) return Response.json(committedId && new URL(url).searchParams.get("id") === `eq.${committedId}` ? [{ id: committedId }] : []);
      if (init.method === "POST" && url.includes("/storage/v1/object/invitation-media/")) {
        uploadCount += 1;
        return uploadCount === 5 ? new Response("Payload Too Large", { status: 413 }) : Response.json({}, { status: 201 });
      }
      if (init.method === "DELETE" && url.endsWith("/storage/v1/object/invitation-media")) {
        removed = JSON.parse(init.body).prefixes;
        return Response.json({});
      }
      if (init.method === "POST" && url.endsWith("/rest/v1/rpc/create_invitation_with_media")) {
        dbCommits += 1;
        const body = JSON.parse(init.body);
        lastCommit = body;
        committedId = body.p_id;
        return Response.json([{ id: body.p_id }]);
      }
      throw new Error(`Unexpected ${init.method ?? "GET"} request: ${url}`);
    };
    const begin = await beginOrFinalize(apiRequest("https://localhost/api/invitations", {
      method: "POST", body: JSON.stringify({ config, slots }),
    }));
    assert.equal(begin.status, 201);
    const { id, uploadToken } = await begin.json();
    const photos = [];
    for (const slot of slots.slice(0, 5)) {
      const form = new FormData();
      form.set("invitationId", id);
      form.set("uploadToken", uploadToken);
      form.set("slot", slot);
      form.set("file", new File([fixturePng], "memory.png", { type: "image/png" }));
      const result = await upload(apiRequest("https://localhost/api/invitations/media", { method: "POST", body: form }));
      if (photos.length === 4) {
        assert.equal(result.status, 503);
        assert.match((await result.json()).error, /could not be uploaded/);
      } else {
        assert.equal(result.status, 201);
        photos.push(await result.json());
      }
    }
    assert.equal(dbCommits, 0);
    const incomplete = await beginOrFinalize(apiRequest("https://localhost/api/invitations", {
      method: "POST", body: JSON.stringify({ operation: "finalize-media", id, uploadToken, config, media: photos }),
    }));
    assert.equal(incomplete.status, 400);
    assert.equal(dbCommits, 0);
    const cleanup = await beginOrFinalize(apiRequest("https://localhost/api/invitations", {
      method: "POST", body: JSON.stringify({ operation: "cancel-media", id, uploadToken, media: photos }),
    }));
    assert.equal(cleanup.status, 200);
    assert.deepEqual(removed, []); // Cancellation cannot race a successful database commit.
    assert.equal(dbCommits, 0);

    const retry = await beginOrFinalize(apiRequest("https://localhost/api/invitations", {
      method: "POST", body: JSON.stringify({ config, slots }),
    }));
    const submission = await retry.json();
    const complete = [];
    for (const slot of slots) {
      const form = new FormData();
      form.set("invitationId", submission.id);
      form.set("uploadToken", submission.uploadToken);
      form.set("slot", slot);
      form.set("file", new File([fixturePng], "memory.png", { type: "image/png" }));
      const result = await upload(apiRequest("https://localhost/api/invitations/media", { method: "POST", body: form }));
      assert.equal(result.status, 201);
      complete.push(await result.json());
    }
    section.images = complete.map((photo) => photo.url);
    const committed = await beginOrFinalize(apiRequest("https://localhost/api/invitations", {
      method: "POST", body: JSON.stringify({ operation: "finalize-media", id: submission.id, uploadToken: submission.uploadToken, config, media: complete }),
    }));
    assert.equal(committed.status, 201);
    assert.equal(dbCommits, 1);
    assert.equal(lastCommit.p_media.length, 6);
    assert.ok(lastCommit.p_media.every((photo) => /^media-[a-f0-9]{64}\//.test(photo.storage_path)));
    const savedFile = new FormData();
    savedFile.set("invitationId", submission.id);
    savedFile.set("uploadToken", submission.uploadToken);
    savedFile.set("slot", slots[0]);
    savedFile.set("file", new File([fixturePng], "extra.png", { type: "image/png" }));
    assert.equal((await upload(apiRequest("https://localhost/api/invitations/media", { method: "POST", body: savedFile }))).status, 409);
    assert.equal(uploadCount, 11);
    const lateCancel = await beginOrFinalize(apiRequest("https://localhost/api/invitations", {
      method: "POST", body: JSON.stringify({ operation: "cancel-media", id: submission.id, uploadToken: submission.uploadToken, media: complete }),
    }));
    assert.equal((await lateCancel.json()).committed, true);
    assert.deepEqual(removed, []); // Cancellation cannot race a successful database commit.
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("Supabase Auth login requires admin membership and stores sessions in HttpOnly cookies", async () => {
  const [{ POST, DELETE }, auth, { default: LoginPage }] = await Promise.all([
    vite.ssrLoadModule("/app/api/admin-session/route.ts"),
    vite.ssrLoadModule("/lib/admin-session.ts"),
    vite.ssrLoadModule("/app/login/page.tsx"),
  ]);
  const keys = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
  const previous = keys.map((key) => process.env[key]);
  const originalFetch = globalThis.fetch;
  const id = "11111111-1111-4111-8111-111111111111";
  let isAdmin = true;
  let refreshes = 0;
  try {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "publishable-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-key";
    globalThis.fetch = async (input, init = {}) => {
      const url = String(input);
      if (!url.includes("/auth/") && !url.includes("/dashboard_admins?") && providerSecurity(url)) return providerSecurity(url);
      if (url.includes("/auth/v1/token?grant_type=password")) {
        const { password } = JSON.parse(init.body);
        return password === "correct password"
          ? Response.json({ access_token: "access-admin", refresh_token: "refresh-admin", expires_in: 3600 })
          : Response.json({ error: "invalid_grant" }, { status: 400 });
      }
      if (url.endsWith("/auth/v1/user")) {
        assert.equal(init.headers.get("apikey"), "publishable-key");
        return init.headers.get("Authorization") === "Bearer expired"
          ? Response.json({ error: "expired" }, { status: 401 })
          : Response.json({ id });
      }
      if (url.includes("/rest/v1/dashboard_admins?")) {
        assert.equal(init.headers.get("apikey"), "server-only-key");
        return Response.json(isAdmin ? [{ user_id: id }] : []);
      }
      if (url.includes("/auth/v1/token?grant_type=refresh_token")) {
        refreshes++;
        return Response.json({ access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600 });
      }
      if (url.endsWith("/auth/v1/logout?scope=local")) return new Response(null, { status: 204 });
      throw new Error("Unexpected authentication request: " + url);
    };
    const loginRequest = (password, origin = "https://paperless.test") => new Request("https://paperless.test/api/admin-session", {
      method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password }),
    });
    assert.equal((await POST(loginRequest("wrong"))).status, 401);
    assert.equal((await POST(loginRequest("correct password", "https://attacker.test"))).status, 403);
    isAdmin = false;
    assert.equal((await POST(loginRequest("correct password"))).status, 401);
    isAdmin = true;
    const ok = await POST(loginRequest("correct password"));
    assert.equal(ok.status, 200);
    const cookie = ok.headers.get("set-cookie");
    assert.match(cookie, /paperless_sb_access=access-admin/);
    assert.match(cookie, /paperless_sb_refresh=refresh-admin/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/i);
    assert.match(cookie, /Secure/);
    assert.deepEqual(await auth.getAdminSession("access-admin", "refresh-admin"), { authorized: true });
    const renewed = await auth.getAdminSession("expired", "refresh-admin");
    assert.equal(renewed.authorized, true);
    assert.equal(renewed.tokens.refresh_token, "new-refresh");
    assert.equal(refreshes, 1);
    isAdmin = false;
    assert.equal((await auth.getAdminSession("access-admin")).authorized, false);
    assert.equal((await DELETE(new Request("https://paperless.test/api/admin-session", {
      method: "DELETE", headers: { Origin: "https://paperless.test", Cookie: "paperless_sb_access=access-admin; paperless_sb_refresh=refresh-admin" },
    }))).status, 200);
    const html = renderToStaticMarkup(React.createElement(LoginPage));
    assert.match(html, /Welcome back/);
    assert.match(html, /Sign in to orders/);
    assert.match(html, /type="email"/);
  } finally {
    globalThis.fetch = originalFetch;
    keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
  }
});

test("dev bootstrap installs missing HEIC dependency before Vite loads invitation designer", async () => {
  const [bootstrap, photo, proxy] = await Promise.all([
    readFile(new URL("../scripts/ensure-dev-deps.mjs", import.meta.url), "utf8"),
    readFile(new URL("../lib/photo-upload.ts", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
  ]);
  assert.match(bootstrap, /"heic-to"/);
  assert.match(bootstrap, /\["ci"\]/);
  assert.match(photo, /import\("heic-to"\)/);
  assert.match(proxy, /matcher: \["\/login", "\/dashboard\/:path\*", "\/api\/dashboard\/:path\*"\]/);
  assert.match(proxy, /new URL\("\/login", request.url\)/);
});

test("saving an admin edit prunes removed image metadata atomically and deletes its stored blob", async () => {
  const [{ PATCH }, { createInitialInvitation }] = await Promise.all([
    vite.ssrLoadModule("/app/api/dashboard/orders/route.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const id = "11111111-1111-4111-8111-111111111111";
  const storagePath = `${id}-customer-john-and-sameer/old-image.webp`;
  const url = `https://test-project.supabase.co/storage/v1/object/public/invitation-media/${storagePath}`;
  const config = createInitialInvitation();
  config.contact = { name: "Customer", phone: "58749327" };
  config.hero.type = "interactive";
  config.hero.photoSource = "upload";
  config.hero.uploadedUrl = url;
  const newConfig = structuredClone(config);
  newConfig.hero.photoSource = "preset";
  newConfig.hero.uploadedUrl = "";
  const order = { id, revision: 1, status: "pending", slug: "john-and-sameer", active_until: null, total_price: 1000, created_at: "2026-09-14T00:00:00Z", deployed_at: null, inactive_at: null, config };
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  let update = null;
  let removedPaths = [];
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  try {
    globalThis.fetch = async (input, init = {}) => {
      const endpoint = String(input);
      if (providerSecurity(endpoint)) return providerSecurity(endpoint);
      if (endpoint.includes("/rest/v1/invitations?") && (!init.method || init.method === "GET")) return Response.json([order]);
      if (endpoint.includes("/rest/v1/invitation_media?") && (!init.method || init.method === "GET")) return Response.json([{ storage_path: storagePath, public_url: url }]);
      if (endpoint.endsWith("/rest/v1/rpc/save_invitation_version")) {
        update = JSON.parse(init.body);
        return Response.json([{ ...order, config: newConfig }]);
      }
      if (endpoint.endsWith("/rest/v1/rpc/claim_media_cleanup")) return Response.json([{ storage_path: storagePath, lease_token: "lease" }]);
      if (init.method === "DELETE" && endpoint.endsWith("/storage/v1/object/invitation-media")) {
        removedPaths = JSON.parse(init.body).prefixes;
        return Response.json({});
      }
      throw new Error(`Unexpected ${init.method ?? "GET"} request: ${endpoint}`);
    };
    const result = await PATCH(apiRequest("https://localhost/api/dashboard/orders", {
      method: "PATCH", body: JSON.stringify({ id, revision: 1, action: "save", config: newConfig, totalPrice: 1000 }),
    }));
    assert.equal(result.status, 200);
    assert.equal(update.p_id, id);
    assert.deepEqual(update.p_media, []);
    assert.equal(update.p_values.config.hero.uploadedUrl, "");
    assert.deepEqual(removedPaths, [storagePath]);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});

test("WhatsApp text distinguishes a plain customer chat from a live invitation; every invitation shares one optimized social image", async () => {
  const [{ customerWhatsAppUrl }, { invitationPreviewImage, invitationSocialDetails, invitationSocialImage }, { createInitialInvitation }] = await Promise.all([
    vite.ssrLoadModule("/lib/whatsapp-messages.ts"),
    vite.ssrLoadModule("/lib/invitation-social.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const chat = new URL(customerWhatsAppUrl("58749327", "Aisha"));
  assert.equal(chat.pathname, "/23058749327");
  assert.equal(chat.searchParams.get("text"), "Hello Aisha, this is paperless invite.");
  const share = new URL(customerWhatsAppUrl("58749327", "Aisha", "https://www.paperless-invites.com/aisha-copy"));
  assert.match(share.searchParams.get("text"), /Link: https:\/\/www\.paperless-invites\.com\/aisha-copy/);
  assert.match(share.searchParams.get("text"), /share with your guests/);
  assert.match(share.searchParams.get("text"), /leave a review/);
  assert.equal(customerWhatsAppUrl("123", "Aisha"), "");
  const config = createInitialInvitation();
  config.opening = { type: "curtain", asset: "classic-curtain", initials: "A" };
  const origin = "https://www.paperless-invites.com";
  const secondConfig = structuredClone(config);
  secondConfig.opening = { type: "envelope", asset: "botanical-envelope", initials: "Z" };
  assert.equal(invitationPreviewImage(origin), `${origin}/social/invitation-preview.jpg`);
  assert.equal(invitationSocialDetails(config, origin, "first-invitation").image, invitationSocialDetails(secondConfig, origin, "second-invitation").image);
  assert.deepEqual(invitationSocialImage, { path: "/social/invitation-preview.jpg", width: 1200, height: 630, type: "image/jpeg" });
  const socialImageFile = new URL("../public/social/invitation-preview.jpg", import.meta.url);
  const socialImage = await readFile(socialImageFile);
  assert.deepEqual(jpegDimensions(socialImage), { width: 1200, height: 630 });
  assert.ok((await stat(socialImageFile)).size < 500_000);
  assert.equal(invitationPreviewImage(config, origin), `${origin}/social/invitation-preview.jpg`);
  const publicPage = await readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(publicPage, /generateMetadata/);
  assert.match(publicPage, /openGraph: \{/);
  assert.match(publicPage, /twitter: \{ card: "summary_large_image"/);
});

test("live invitation metadata uses couple-specific copy with the shared social image", async () => {
  const [{ generateMetadata }, { createInitialInvitation }] = await Promise.all([
    vite.ssrLoadModule("/app/[slug]/page.tsx"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const firstConfig = createInitialInvitation();
  firstConfig.hero.firstName = "John";
  firstConfig.hero.secondName = "Sameer";
  firstConfig.opening.type = "envelope";
  const secondConfig = createInitialInvitation();
  secondConfig.hero.firstName = "Ayesha";
  secondConfig.hero.secondName = "Hamza";
  secondConfig.opening.type = "curtain";
  const originalFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const previousPublicSiteUrl = process.env.PUBLIC_SITE_URL;
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  delete process.env.PUBLIC_SITE_URL;
  try {
    globalThis.fetch = async (input) => {
      const params = new URL(String(input)).searchParams;
      const isFirst = params.get("slug") === "eq.john-and-sameer";
      const config = isFirst ? firstConfig : secondConfig;
      return Response.json([params.get("select") === "config"
        ? { config }
        : { id: isFirst ? "11111111-1111-4111-8111-111111111111" : "22222222-2222-4222-8222-222222222222", revision: 1 }]);
    };
    const firstMetadata = await generateMetadata({ params: Promise.resolve({ slug: "john-and-sameer" }) });
    const secondMetadata = await generateMetadata({ params: Promise.resolve({ slug: "ayesha-and-hamza" }) });
    assert.equal(firstMetadata.title, "John & Sameer — You're Invited");
    assert.equal(secondMetadata.title, "Ayesha & Hamza — You're Invited");
    assert.equal(firstMetadata.description, "You're invited to celebrate the wedding of John & Sameer. Open their Paperless Invite for the celebration details.");
    assert.equal(secondMetadata.description, "You're invited to celebrate the wedding of Ayesha & Hamza. Open their Paperless Invite for the celebration details.");
    assert.equal(firstMetadata.openGraph.title, firstMetadata.title);
    assert.equal(secondMetadata.openGraph.title, secondMetadata.title);
    assert.equal(firstMetadata.openGraph.description, firstMetadata.description);
    assert.equal(secondMetadata.openGraph.description, secondMetadata.description);
    assert.equal(firstMetadata.openGraph.url, "https://www.paperless-invites.com/john-and-sameer");
    assert.equal(secondMetadata.openGraph.url, "https://www.paperless-invites.com/ayesha-and-hamza");
    assert.equal(firstMetadata.openGraph.images[0].url, "https://www.paperless-invites.com/social/invitation-preview.jpg");
    assert.equal(secondMetadata.openGraph.images[0].url, firstMetadata.openGraph.images[0].url);
    assert.equal(firstMetadata.openGraph.images[0].width, 1200);
    assert.equal(firstMetadata.openGraph.images[0].height, 630);
    assert.equal(firstMetadata.openGraph.images[0].type, "image/jpeg");
    assert.equal(firstMetadata.openGraph.type, "website");
    assert.equal(firstMetadata.twitter.card, "summary_large_image");
    assert.equal(firstMetadata.twitter.title, firstMetadata.title);
    assert.equal(firstMetadata.twitter.description, firstMetadata.description);
    assert.deepEqual(firstMetadata.twitter.images, [firstMetadata.openGraph.images[0].url]);
    assert.deepEqual(firstMetadata.robots, { index: false, follow: false });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    if (previousPublicSiteUrl === undefined) delete process.env.PUBLIC_SITE_URL; else process.env.PUBLIC_SITE_URL = previousPublicSiteUrl;
  }
});

test("supports automatic invitation routes and order lifecycle storage", async () => {
  const { createInitialInvitation, createSection } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const { makeInvitationSlug, summarizeOrder, todayInMauritius } = await vite.ssrLoadModule("/lib/invitation-orders.ts");
  const config = createInitialInvitation();
  config.hero.firstName = "Salma";
  config.hero.secondName = "Sam";
  assert.equal(makeInvitationSlug(config), "salma-and-sam");
  assert.equal(todayInMauritius(new Date("2027-05-22T20:00:00Z")), "2027-05-23");
  const order = { id: "11111111-1111-4111-8111-111111111111", status: "pending", slug: null, active_until: null, total_price: 1000, created_at: "2026-09-12T08:15:00Z", deployed_at: null, inactive_at: null, config };
  assert.equal(summarizeOrder(order).hasCustomPart, false);
  assert.equal(summarizeOrder(order).suggestedSlug, "salma-and-sam");
  const { getPublicSiteOrigin } = await vite.ssrLoadModule("/lib/invitation-orders-server.ts");
  const previousPublicSiteUrl = process.env.PUBLIC_SITE_URL;
  try {
    delete process.env.PUBLIC_SITE_URL;
    assert.equal(getPublicSiteOrigin(new Request("http://localhost:5173/dashboard")), "https://www.paperless-invites.com");
  } finally {
    if (previousPublicSiteUrl === undefined) delete process.env.PUBLIC_SITE_URL; else process.env.PUBLIC_SITE_URL = previousPublicSiteUrl;
  }
  config.sections.push(createSection("custom"));
  assert.equal(summarizeOrder(order).hasCustomPart, true);

  const [migration, proxy, publicRoute, privatePreview, dashboardApi, customerApi, designer, dashboard, dashboardStyles, confirmation] = await Promise.all([
    readFile(new URL("../supabase/dashboard-migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/preview/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/dashboard/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/invitations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/designer/invitation-designer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/dashboard/invitation-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/dashboard.css", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/order-confirmation-modal.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /status in \('pending', 'active', 'inactive'\)/);
  assert.match(migration, /active_until/);
  assert.match(migration, /invitations_slug_idx/);
  assert.match(migration, /drop column if exists updated_at/);
  assert.match(proxy, /getAdminSession/);
  assert.match(proxy, /\/api\/dashboard/);
  assert.match(proxy, /\/dashboard\/:path\*/);
  assert.match(publicRoute, /getPublicInvitationBySlug/);
  assert.match(publicRoute, /force-dynamic/);
  assert.match(privatePreview, /getInvitationOrder/);
  assert.match(privatePreview, /PublishedInvitation/);
  assert.match(privatePreview, /Private preview/);
  assert.match(dashboardApi, /createUniqueInvitationSlug/);
  assert.match(dashboardApi, /action === "deactivate"/);
  assert.match(dashboardApi, /action === "review"/);
  assert.match(dashboardApi, /action === "prepare-link"/);
  assert.match(dashboardApi, /export const DELETE = withAdmin/);
  assert.doesNotMatch(customerApi, /export async function GET/);
  assert.match(customerApi, /createUniqueInvitationSlug\(\{ id, config: body\.config \}\)/);
  assert.doesNotMatch(designer, /localStorage/);
  assert.match(designer, /Your invitation has been sent for processing/);
  assert.match(designer, /window\.location\.assign\("\/"\)/);
  assert.match(designer, /7000/);
  assert.doesNotMatch(designer, /window\.confirm/);
  assert.match(dashboard, /new Set\(\["pending"\]\)/);
  assert.match(dashboard, /orders-datatable/);
  assert.match(dashboard, /<tr className=\{order\.hasCustomPart \? "has-custom-part" : undefined\}>/);
  assert.doesNotMatch(dashboard, /<th scope="col">Custom<\/th>|data-label="Custom part"|orders-custom-(?:cell|badge|empty)/);
  assert.match(dashboardStyles, /tr\.has-custom-part \{[^}]*radial-gradient[^}]*linear-gradient/);
  assert.match(dashboardStyles, /tr\.has-custom-part:hover/);
  assert.match(dashboardStyles, /@media \(max-width: 700px\)[\s\S]*?tr\.has-custom-part/);
  assert.doesNotMatch(dashboardStyles, /orders-custom-(?:cell|badge|empty)/);
  assert.match(dashboard, /\/dashboard\/preview\/\$\{order\.id\}/);
  assert.match(dashboard, /customerWhatsAppUrl/);
  assert.doesNotMatch(dashboard, /window\.confirm/);
  assert.match(confirmation, /role="dialog"/);
});

test("renders the complete Coastal Reverie invitation", async () => {
  const { default: Invitation } = await vite.ssrLoadModule("/app/templates/coastal-reverie/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Invitation));
  assert.match(html, /ivory-envelope-mobile\.webp/);
  assert.match(html, /ivory-envelope-desktop\.webp/);
  assert.match(html, /Salma/);
  assert.match(html, /Counting the days/);
  assert.match(html, /Our Journey/);
  assert.match(html, /In Loving Memory/);
  assert.match(html, /Mehendi Evening/);
  assert.match(html, /Seating Arrangement/);
  assert.match(html, /The Rahman Family/);
  assert.match(html, /Day Programme/);
  assert.doesNotMatch(html, /rose-scratch-hero/);
  assert.doesNotMatch(html, /rose-wedding-curtains/);
  assert.doesNotMatch(html, /A Glimpse of Us/);
});

test("renders the complete Rose Afterglow invitation", async () => {
  const { default: Invitation } = await vite.ssrLoadModule("/app/templates/rose-afterglow/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Invitation));
  assert.match(html, /Sofia/);
  assert.match(html, /Samuel/);
  assert.match(html, /Tap to open/);
  assert.match(html, /rose-wedding-curtains-olive\.webp/);
  assert.match(html, /rose-scratch-hero-olive\.webp/);
  assert.match(html, /rose-couple-hands-default\.webp/);
  assert.match(html, /rose-ornate-frame-ivory\.webp/);
  assert.doesNotMatch(html, /Pull to open/);
  assert.doesNotMatch(html, /Scroll to reveal/);
  assert.doesNotMatch(html, /Tap to reveal/);
  assert.match(html, /Scratch the translucent oval/);
  assert.match(html, /Wedding details/);
  assert.match(html, /Counting the days/);
  assert.match(html, /A Glimpse of Us/);
  assert.match(html, /A few favourite memories/);
  assert.match(html, /Our Journey/);
  assert.match(html, /In Loving Memory/);
  assert.match(html, /Mehendi Evening/);
  assert.match(html, /Seating Arrangement/);
  assert.match(html, /The Rahman Family/);
  assert.match(html, /Day Programme/);
  assert.match(html, /rose-afterglow\.webp/);
});

test("keeps both invitation templates structurally independent", async () => {
  const [coastalComponent, coastalStyles, roseComponent] = await Promise.all([
    readFile(new URL("../components/invitation/templates/coastal-reverie.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/templates/coastal-reverie.module.css", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation/templates/rose-afterglow.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(coastalComponent, /RoseAfterglow|rosePhase|rose-scratch|rose-wedding/);
  assert.doesNotMatch(coastalStyles, /roseVariant|roseCurtain|scratchHero|glimpseSection/);
  assert.doesNotMatch(roseComponent, /CoastalReverieInvitation|coastal-reverie\.module\.css|variant=["']rose["']/);
  assert.doesNotMatch(roseComponent, /Your invitation is revealed/);
  assert.match(roseComponent, /rose-afterglow\.module\.css/);
});

test("custom sections preserve order and responsive CSS while removing dangerous HTML", async () => {
  const [designer, customSections, validation] = await Promise.all([
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
    vite.ssrLoadModule("/lib/custom-sections.ts"),
    vite.ssrLoadModule("/lib/invitation-validation.ts"),
  ]);
  const config = designer.createInitialInvitation();
  config.contact = { name: "Admin Customer", phone: "58749327" };
  const custom = designer.createSection("custom");
  custom.id = "custom-accommodation";
  custom.title = "Accommodation Information";
  custom.fields.html = `<section class="hotel-section"><h2>Where to Stay</h2><img src="https://example.com/hotel.jpg" onerror="alert('test')"><script>alert("test")</script><iframe src="https://example.com"></iframe><object data="x"></object><embed src="x"><a href="javascript:alert('x')" onclick="alert('x')">Book</a></section>`;
  custom.fields.css = `.hotel-section { padding: 60px 20px; }\nh2 { font-size: 80px; }\n@media (max-width: 600px) { .hotel-section { padding: 40px 16px; } }\n</style><script>alert('css')</script>`;
  config.sections.splice(1, 0, custom);

  assert.equal(validation.isInvitationConfig(config), true);
  const safe = customSections.sanitizeInvitationCustomSections(config);
  assert.deepEqual(safe.sections.map((section) => section.id), config.sections.map((section) => section.id));
  assert.equal(safe.sections[1].title, "Accommodation Information");
  assert.match(safe.sections[1].fields.html, /hotel-section/);
  assert.match(safe.sections[1].fields.html, /Where to Stay/);
  assert.doesNotMatch(safe.sections[1].fields.html, /<script|onerror|onclick|<iframe|<object|<embed|javascript:/i);
  assert.match(safe.sections[1].fields.css, /h2 \{ font-size: 80px; \}/);
  assert.match(safe.sections[1].fields.css, /@media \(max-width: 600px\)/);
  assert.doesNotMatch(safe.sections[1].fields.css, /<\/?(?:style|script)/i);

  const normalized = designer.normalizeInvitationConfig(safe);
  assert.equal(normalized.sections[1].fields.html, safe.sections[1].fields.html);
  assert.equal(normalized.sections[1].fields.css, safe.sections[1].fields.css);
  const oversized = structuredClone(config);
  oversized.sections[1].fields.html = "x".repeat(customSections.maxCustomSectionHtmlLength + 1);
  assert.equal(validation.isInvitationConfig(oversized), false);
});

test("one isolated custom renderer serves live preview and published invitation in array order", async () => {
  const [{ PublishedInvitation }, { InvitationDesigner }, { buildCustomSectionDocument }, designer, orders] = await Promise.all([
    vite.ssrLoadModule("/components/invitation/invitation-preview.tsx"),
    vite.ssrLoadModule("/components/designer/invitation-designer.tsx"),
    vite.ssrLoadModule("/components/invitation/custom-section-renderer.tsx"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
    vite.ssrLoadModule("/lib/invitation-orders.ts"),
  ]);
  const config = designer.createInitialInvitation();
  config.contact = { name: "Admin Customer", phone: "58749327" };
  const custom = designer.createSection("custom");
  custom.id = "custom-hotel";
  custom.title = "Accommodation Information";
  custom.fields.html = `<section class="hotel-section" data-order-marker="custom-first"><h2>Where to Stay</h2></section>`;
  custom.fields.css = `.hotel-section { color: var(--invitation-text); background: var(--invitation-card); border: 1px solid var(--invitation-border); box-shadow: 0 0 0 1px #345c42; }\nh2 { color: var(--invitation-primary); font-size: 80px; }\n@media (max-width: 600px) { h2 { font-size: 24px; } }`;
  config.sections.unshift(custom);

  const paletteExpectations = {
    beige: { primary: "#7a4326", background: "#f4dfc7" },
    olive: { primary: "#485523", background: "#dfe5bd" },
    "dusty-blue": { primary: "#315c7c", background: "#c9e1ed" },
    burgundy: { primary: "#6d1735", background: "#e8aebf" },
  };
  for (const [palette, expected] of Object.entries(paletteExpectations)) {
    const variables = designer.getInvitationThemeVariables(palette);
    assert.equal(variables["--invitation-primary"], expected.primary);
    assert.equal(variables["--invitation-background"], expected.background);
    assert.equal(variables["--invitation-card"], designer.getPalette(palette).theme.surface);
    const themedDocument = buildCustomSectionDocument(custom.fields.html, custom.fields.css, palette);
    assert.match(themedDocument, new RegExp(`--invitation-primary: ${expected.primary}`));
    assert.match(themedDocument, /color: var\(--invitation-text\)/);
    assert.match(themedDocument, /background: var\(--invitation-card\)/);
    assert.match(themedDocument, /#345c42/);
  }

  const documentHtml = buildCustomSectionDocument(custom.fields.html, custom.fields.css, "beige");
  assert.match(documentHtml, /Content-Security-Policy/);
  assert.match(documentHtml, /script-src 'none'/);
  assert.match(documentHtml, /@media \(max-width: 600px\)/);
  assert.match(documentHtml, /h2 \{ color: var\(--invitation-primary\); font-size: 80px; \}/);
  assert.match(documentHtml, /--invitation-background-alt: #fff8ed/);
  assert.match(documentHtml, /--invitation-text-muted: #765344/);
  assert.match(documentHtml, /--invitation-border: #d9a56c/);
  assert.match(documentHtml, /--invitation-card: #fff8ed/);
  config.palette = "olive";
  const published = renderToStaticMarkup(React.createElement(PublishedInvitation, { config }));
  assert.match(published, /custom-section-frame/);
  assert.match(published, /--invitation-primary: #485523/);
  assert.match(published, /sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"/);
  assert.doesNotMatch(published, /allow-scripts/);
  assert.ok(published.indexOf("custom-first") < published.indexOf("Counting the days"));

  const updatedConfig = structuredClone(config);
  updatedConfig.sections[0].fields.html = `<section data-order-marker="custom-edited">Edited accommodation</section>`;
  const updated = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: updatedConfig }));
  assert.match(updated, /custom-edited/);
  assert.doesNotMatch(updated, /custom-first/);
  const withoutCustom = { ...updatedConfig, sections: updatedConfig.sections.filter((section) => section.id !== custom.id) };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(PublishedInvitation, { config: withoutCustom })), /custom-section-frame|custom-edited/);

  const order = { id: "11111111-1111-4111-8111-111111111111", status: "pending", slug: "admin-customer", active_until: null, total_price: 1500, created_at: "2026-09-15T00:00:00Z", deployed_at: null, inactive_at: null, config };
  const admin = renderToStaticMarkup(React.createElement(InvitationDesigner, { adminOrder: { ...order, summary: orders.summarizeOrder(order) }, today: "2026-09-15" }));
  assert.match(admin, /Custom Section/);
  assert.match(admin, /Custom section source/);
  assert.match(admin, /Section Name/);
  assert.match(admin, />HTML</);
  assert.match(admin, />CSS</);
  assert.match(admin, /Invitation palette variables/);
  assert.match(admin, /Automatically use this invitation&#x27;s selected colour palette/);
  for (const variable of designer.invitationThemeVariableDefinitions) assert.match(admin, new RegExp(`var\\(${variable.name}\\)`));
  assert.match(admin, /hotel-section/);
  const customer = renderToStaticMarkup(React.createElement(InvitationDesigner));
  assert.doesNotMatch(customer, /Custom section source|Section Name/);
});

test("customer API rejects custom source and admin saves persist only sanitized source", async () => {
  const [{ POST: customerPost }, { PATCH: adminPatch }, designer] = await Promise.all([
    vite.ssrLoadModule("/app/api/invitations/route.ts"),
    vite.ssrLoadModule("/app/api/dashboard/orders/route.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const id = "11111111-1111-4111-8111-111111111111";
  const config = designer.createInitialInvitation();
  config.contact = { name: "Admin Customer", phone: "58749327" };
  const custom = designer.createSection("custom");
  custom.title = "Accommodation Information";
  custom.fields.html = `<section class="hotel-section" onclick="alert('x')"><h2>Where to Stay</h2><script>alert('x')</script></section>`;
  custom.fields.css = `h2 { font-size: 80px; } @media (max-width: 600px) { h2 { font-size: 24px; } }`;
  config.sections.push(custom);


  const order = { id, revision: 1, status: "pending", slug: "admin-customer", active_until: null, total_price: 1500, created_at: "2026-09-15T00:00:00Z", deployed_at: null, inactive_at: null, config: designer.createInitialInvitation() };
  order.config.contact = config.contact;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  let savedConfig = null;
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  try {
    globalThis.fetch = async (input, init = {}) => {
      const endpoint = String(input);
      if (providerSecurity(endpoint)) return providerSecurity(endpoint);
      if (endpoint.includes("/rest/v1/invitations?") && (!init.method || init.method === "GET")) return Response.json([order]);
      if (endpoint.includes("/rest/v1/invitation_media?") && (!init.method || init.method === "GET")) return Response.json([]);
      if (endpoint.endsWith("/rest/v1/rpc/claim_media_cleanup")) return Response.json([]);
      if (endpoint.endsWith("/rest/v1/rpc/save_invitation_version")) {
        const update = JSON.parse(init.body);
        savedConfig = update.p_values.config;
        return Response.json([{ ...order, ...update.p_values }]);
      }
      throw new Error(`Unexpected ${init.method ?? "GET"} request: ${endpoint}`);
    };
  const customerResponse = await customerPost(apiRequest("https://localhost/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config }),
  }));
  assert.equal(customerResponse.status, 403);
  assert.match((await customerResponse.json()).error, /only be added by an administrator/);

    const adminResponse = await adminPatch(apiRequest("https://localhost/api/dashboard/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, revision: 1, action: "save", config, totalPrice: 1500 }),
    }));
    assert.equal(adminResponse.status, 200);
    assert.ok(savedConfig);
    const savedCustom = savedConfig.sections.find((section) => section.type === "custom");
    assert.match(savedCustom.fields.html, /hotel-section/);
    assert.doesNotMatch(savedCustom.fields.html, /<script|onclick/i);
    assert.match(savedCustom.fields.css, /@media \(max-width: 600px\)/);
    const responseCustom = (await adminResponse.json()).order.config.sections.find((section) => section.type === "custom");
    assert.deepEqual(responseCustom, savedCustom);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
  }
});
