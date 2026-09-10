import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("renders the complete Paperless Invites landing page", async () => {
  const { default: Home } = await vite.ssrLoadModule("/app/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Home));
  assert.match(html, /The most elegant/);
  assert.match(html, /Soft &amp; Timeless/);
  assert.match(html, /Olive Romance/);
  assert.match(html, /Make the first tap/);
  assert.match(html, /Paper or digital/);
  assert.match(html, /Simple pricing/);
  assert.match(html, /Enquiries welcome/);
  assert.match(html, /\/design-invitation/);
});

test("renders the guided invitation designer and mobile preview", async () => {
  const { default: Designer } = await vite.ssrLoadModule("/app/design-invitation/page.tsx");
  const html = renderToStaticMarkup(React.createElement(Designer));
  assert.match(html, /Create your invitation/);
  assert.match(html, /Choose your colours/);
  assert.match(html, /Add Bismillah at the top/);
  assert.match(html, /Show Bismillah/);
  assert.match(html, /Envelope &amp; wax seal/);
  assert.match(html, /Interactive hero/);
  assert.match(html, /A Special Message/);
  assert.match(html, /Live mobile preview/);
  assert.match(html, /Save my design/);
  assert.match(html, /Rs 1,000/);
  assert.match(html, /Add a moment/);
  assert.match(html, /Add another event/);
  assert.match(html, /Date to count down to/);
  assert.match(html, /Choose an additional part/);
  assert.match(html, /\+ Rs 150/);
  assert.match(html, /video consultation/);
  assert.match(html, /For the easiest design experience/);
  assert.match(html, /Your name/);
  assert.match(html, /Mauritian phone or WhatsApp number/);
  assert.match(html, /Grand ballroom/);
  assert.match(html, /Garden ceremony/);
  assert.match(html, /Islamic elegance/);
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
    "builder-interactive-hands.webp",
    "builder-interactive-bouquet.webp",
    "builder-interactive-garden-walk.webp",
  );
  await Promise.all(assets.map((asset) => access(new URL(`../public/images/${asset}`, import.meta.url))));
});

test("uses the revised hero, photo choices and additional-part prices", async () => {
  const { calculateInvitationPrice, createInitialInvitation, createSection, heroPresets, interactiveHeroPresets, sectionDefinitions } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const config = createInitialInvitation();
  config.hero.type = "interactive";
  config.sections.push(createSection("countdown"), createSection("glimpse"));

  assert.equal(sectionDefinitions.countdown.price, 150);
  assert.equal(sectionDefinitions.glimpse.price, 200);
  const basicUrls = new Set(Object.values(heroPresets).flat().map((preset) => preset.url));
  assert.ok(interactiveHeroPresets.every((preset) => !basicUrls.has(preset.url)));
  assert.deepEqual(calculateInvitationPrice(config), {
    base: 1000,
    opening: 0,
    hero: 200,
    sections: 350,
    total: 1550,
  });
});

test("protects mobile preview interactions and layout regressions", async () => {
  const [designer, preview, styles] = await Promise.all([
    readFile(new URL("../components/invitation-designer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation-phone-preview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/design-invitation/design-invitation.css", import.meta.url), "utf8"),
  ]);

  assert.match(designer, /function choosePalette\(id: PaletteId\) \{\s*updateConfig\(\(current\) => \(\{ \.\.\.current, palette: id \}\)\);\s*\}/);
  assert.match(preview, /touchedRef\.current\.size \/ eligibleCells >= \.75/);
  assert.doesNotMatch(preview, /images\.slice\(0, 6\)/);
  assert.doesNotMatch(preview, /preview-envelope-seal-blank/);
  assert.doesNotMatch(preview, /invite-preview-monogram/);
  assert.match(styles, /\.designer-steps \{\s*position: relative/);
  assert.match(styles, /\.designer-fixed-price \{ position: sticky/);
  assert.match(styles, /\.designer-opening-thumb \{ height: auto; aspect-ratio: 2 \/ 3/);
  assert.match(styles, /\.invite-preview-hero-shade::after \{ content: none/);
  assert.match(styles, /\.invite-preview-bismillah img \{[^}]*brightness\(0\) invert\(1\)/);
  assert.match(styles, /@keyframes preview-sparkle-burst/);
  assert.match(designer, /pattern="5\[0-9\]\{7\}"/);
  assert.doesNotMatch(designer, /setNotice/);
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
    readFile(new URL("../components/coastal-reverie-invitation.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/templates/coastal-reverie/coastal-reverie.module.css", import.meta.url), "utf8"),
    readFile(new URL("../components/rose-afterglow-invitation.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(coastalComponent, /RoseAfterglow|rosePhase|rose-scratch|rose-wedding/);
  assert.doesNotMatch(coastalStyles, /roseVariant|roseCurtain|scratchHero|glimpseSection/);
  assert.doesNotMatch(roseComponent, /CoastalReverieInvitation|coastal-reverie\.module\.css|variant=["']rose["']/);
  assert.doesNotMatch(roseComponent, /Your invitation is revealed/);
  assert.match(roseComponent, /rose-afterglow\.module\.css/);
});
