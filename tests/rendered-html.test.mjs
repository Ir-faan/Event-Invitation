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
  assert.match(html, /Your celebration/);
  assert.match(html, /\/design-invitation/);
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
  assert.match(html, /video consultation or by message/);
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
  const { bismillahAssets, builderAssetVersion, calculateInvitationPrice, createInitialInvitation, createSection, getCoupleInitials, heroPresets, interactiveFrameAssets, interactiveHeroPresets, openingAssets, sectionDefinitions } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const config = createInitialInvitation();
  config.hero.type = "interactive";
  config.sections.push(createSection("countdown"), createSection("glimpse"));
  assert.equal(createSection("countdown").fields.time, "18:30");

  assert.equal(sectionDefinitions.countdown.price, 150);
  assert.equal(sectionDefinitions.glimpse.price, 200);
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
  assert.ok(versionedAssetUrls.every((url) => url.endsWith(`?v=${builderAssetVersion}`)));
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
});

test("renders the private order dashboard shell without a public login", async () => {
  const { default: Dashboard } = await vite.ssrLoadModule("/app/dashboard/page.tsx");
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
    vite.ssrLoadModule("/components/invitation-designer.tsx"),
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
  assert.doesNotMatch(html, /designer-step-card designer-main-step[^>]*open=/);
  const liveRecord = { ...record, status: "active", active_until: "2027-09-12", deployed_at: "2026-09-12T09:00:00Z" };
  const liveHtml = renderToStaticMarkup(React.createElement(InvitationDesigner, { adminOrder: { ...liveRecord, summary: summarizeOrder(liveRecord) }, today: "2026-09-12" }));
  assert.match(liveHtml, /Update live invitation/);
  assert.doesNotMatch(liveHtml, />Save edits</);
  assert.equal((liveHtml.match(/Update live invitation</g) ?? []).length, 1);
});

test("published invitations use the browser width while editor previews keep their phone frame", async () => {
  const [css, designerCss, { PublishedInvitation }, { createInitialInvitation }] = await Promise.all([
    readFile(new URL("../app/[slug]/published-invitation.css", import.meta.url), "utf8"),
    readFile(new URL("../app/design-invitation/design-invitation.css", import.meta.url), "utf8"),
    vite.ssrLoadModule("/components/invitation-phone-preview.tsx"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const html = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: createInitialInvitation() }));
  assert.match(html, /class="published-invitation"/);
  assert.match(html, /designer-phone-screen published-invitation-screen/);
  assert.match(css, /\.published-invitation-screen\s*\{[^}]*width: 100%;[^}]*height: auto;[^}]*overflow: visible;/);
  assert.doesNotMatch(css, /width:\s*min\(30rem/);
  assert.match(css, /@media \(min-width: 48rem\)/);
  assert.match(css, /@media \(min-width: 64rem\)/);
  assert.match(css, /\.published-invitation \.preview-opening \{ position: fixed/);
  assert.match(css, /\.published-invitation \.preview-event-list \{[^}]*grid-template-columns:/);
  assert.match(designerCss, /\.designer-phone-screen \{[^}]*height: clamp\(22rem/);
});

test("duplicates review orders with independent photo storage and rejects live orders", async () => {
  const [{ POST }, { createInitialInvitation, createSection }] = await Promise.all([
    vite.ssrLoadModule("/app/api/dashboard/orders/route.ts"),
    vite.ssrLoadModule("/lib/invitation-designer.ts"),
  ]);
  const originalId = "11111111-1111-4111-8111-111111111111";
  const storageOrigin = "https://test-project.supabase.co";
  const oldUrl = `${storageOrigin}/storage/v1/object/public/invitation-media/${originalId}/photo.jpg`;
  const config = createInitialInvitation();
  config.hero.type = "interactive";
  config.hero.photoSource = "uploaded";
  config.hero.uploadedUrl = oldUrl;
  const gallery = createSection("glimpse");
  gallery.images = [oldUrl];
  config.sections.push(gallery);
  const original = { id: originalId, status: "pending", slug: "custom-link", active_until: null, total_price: 1730, created_at: "2026-09-12T08:15:00Z", deployed_at: null, inactive_at: null, config };
  const existingFetch = globalThis.fetch;
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = storageOrigin;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  const posts = [];
  let failMediaInsert = false;
  const response = (value, status = 200) => Response.json(value, { status });
  const endpoint = "/api/dashboard/orders";
  try {
    globalThis.fetch = async (input, init = {}) => {
      const url = String(input);
      if (url.includes("/rest/v1/invitations?") && (!init.method || init.method === "GET")) {
        if (new URL(url).searchParams.get("select") === "id") return response([]);
        return response([original]);
      }
      if (url.includes("/rest/v1/invitation_media?") && (!init.method || init.method === "GET")) {
        return response([{ storage_path: `${originalId}/photo.jpg`, public_url: oldUrl, slot: "hero", mime_type: "image/jpeg", size_bytes: 3 }]);
      }
      if (url === oldUrl) return new Response(new Uint8Array([1, 2, 3]), { status: 200 });
      if (init.method === "POST" && url.includes("/storage/v1/object/invitation-media/")) {
        posts.push({ type: "photo", url });
        return response({});
      }
      if (init.method === "POST" && url.includes("/rest/v1/invitations?")) {
        const values = JSON.parse(init.body);
        posts.push({ type: "order", values });
        return response([{ ...original, ...values, active_until: null, deployed_at: null, inactive_at: null }], 201);
      }
      if (init.method === "POST" && url.endsWith("/rest/v1/invitation_media")) {
        posts.push({ type: "media", values: JSON.parse(init.body) });
        return failMediaInsert ? response({ message: "Insert failed" }, 500) : response({}, 201);
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

    const duplicated = await POST(new Request(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    assert.equal(duplicated.status, 201);
    const { order } = await duplicated.json();
    assert.equal(order.status, "pending");
    assert.equal(order.slug, "custom-link-copy");
    assert.equal(order.total_price, 1730);
    assert.notEqual(order.id, originalId);
    assert.deepEqual(posts.map((item) => item.type), ["photo", "order", "media"]);
    const photoUrl = posts[2].values[0].public_url;
    assert.match(photoUrl, new RegExp(`/${order.id}/`));
    assert.equal(posts[1].values.config.hero.uploadedUrl, photoUrl);
    assert.equal(order.config.hero.uploadedUrl, photoUrl);
    assert.equal(posts[1].values.config.sections.at(-1).images[0], photoUrl);
    assert.equal(posts[2].values[0].invitation_id, order.id);
    assert.notEqual(photoUrl, oldUrl);

    original.status = "active";
    const denied = await POST(new Request(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    assert.equal(denied.status, 409);
    assert.equal(posts.length, 3);

    original.status = "pending";
    failMediaInsert = true;
    const previousConsoleError = console.error;
    const expectedErrors = [];
    let unsuccessful;
    try {
      console.error = (...args) => expectedErrors.push(args);
      unsuccessful = await POST(new Request(`https://localhost${endpoint}`, { method: "POST", body: JSON.stringify({ id: originalId, action: "duplicate" }) }));
    } finally {
      console.error = previousConsoleError;
    }
    assert.match(expectedErrors[0][0], /Unable to duplicate invitation order/);
    assert.equal(unsuccessful.status, 503);
    assert.deepEqual(posts.slice(3).map((item) => item.type), ["photo", "order", "media", "order-rollback", "photo-rollback"]);
    assert.match(posts[6].url, new RegExp(`id=eq\\.${posts[4].values.id}`));
    assert.deepEqual(posts[7].values.prefixes, [posts[5].values[0].storage_path]);
  } finally {
    globalThis.fetch = existingFetch;
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
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
  config.sections.push(createSection("custom"));
  assert.equal(summarizeOrder(order).hasCustomPart, true);

  const [migration, proxy, publicRoute, privatePreview, dashboardApi, customerApi, designer, dashboard, confirmation] = await Promise.all([
    readFile(new URL("../supabase/dashboard-migration.sql", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/dashboard/preview/[id]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/dashboard/orders/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/invitations/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation-designer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/invitation-dashboard.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/order-confirmation-modal.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /status in \('pending', 'active', 'inactive'\)/);
  assert.match(migration, /active_until/);
  assert.match(migration, /invitations_slug_idx/);
  assert.match(migration, /drop column if exists updated_at/);
  assert.match(proxy, /DASHBOARD_USERNAME/);
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
  assert.match(dashboardApi, /export async function DELETE/);
  assert.doesNotMatch(customerApi, /export async function GET/);
  assert.match(customerApi, /createUniqueInvitationSlug\(\{ id, config: body\.config \}\)/);
  assert.doesNotMatch(designer, /localStorage/);
  assert.match(designer, /Your invitation has been sent for processing/);
  assert.match(designer, /window\.location\.assign\("\/"\)/);
  assert.match(designer, /7000/);
  assert.doesNotMatch(designer, /window\.confirm/);
  assert.match(dashboard, /new Set\(\["pending"\]\)/);
  assert.match(dashboard, /orders-datatable/);
  assert.match(dashboard, /Custom part/);
  assert.match(dashboard, /\/dashboard\/preview\/\$\{order\.id\}/);
  assert.match(dashboard, /wa\.me\/230/);
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
