import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false, ws: false } });
after(() => vite.close());
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
const id = "11111111-1111-4111-8111-111111111111";
const request = (path, method = "POST", value = {}, authenticated = false) => new Request(`https://paperless.test${path}`, {
  method, headers: { Origin: "https://paperless.test", "Content-Type": "application/json", "Idempotency-Key": id, ...(authenticated ? { Cookie: "paperless_sb_access=admin" } : {}) },
  ...(!["GET", "HEAD"].includes(method) ? { body: JSON.stringify(value) } : {}),
});
async function mocked(provider, task) {
  const keys = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PUBLISHABLE_KEY"];
  const values = keys.map((key) => process.env[key]);
  const fetch = globalThis.fetch;
  process.env.SUPABASE_URL = "https://storage.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "synthetic-server-secret";
  process.env.SUPABASE_PUBLISHABLE_KEY = "synthetic-public-key";
  globalThis.fetch = provider;
  try { await task(); } finally {
    globalThis.fetch = fetch;
    keys.forEach((key, i) => { if (values[i] === undefined) delete process.env[key]; else process.env[key] = values[i]; });
  }
}
function authResponse(url) {
  if (url.endsWith("/auth/v1/user")) return Response.json({ id });
  if (url.includes("/dashboard_admins?")) return Response.json([{ user_id: id }]);
}

test("every admin API independently rejects unauthenticated access and cross-origin mutation", async () => {
  const orders = await vite.ssrLoadModule("/app/api/dashboard/orders/route.ts");
  const media = await vite.ssrLoadModule("/app/api/dashboard/orders/media/route.ts");
  await mocked(async () => { throw new Error("Unauthenticated requests must not query Supabase"); }, async () => {
    for (const [handlers, path] of [[orders, "/api/dashboard/orders"], [media, "/api/dashboard/orders/media"]]) {
      for (const method of ["GET", "POST", "PATCH", "DELETE"].filter((name) => handlers[name])) {
        assert.equal((await handlers[method](request(path, method))).status, 401);
        if (method !== "GET") assert.equal((await handlers[method](new Request(`https://paperless.test${path}`, { method, headers: { Origin: "https://attacker.test", Cookie: "paperless_sb_access=admin" } }))).status, 403);
      }
    }
  });
});

test("an authenticated ordinary user is denied even when bypassing the proxy", async () => {
  const { GET } = await vite.ssrLoadModule("/app/api/dashboard/orders/route.ts");
  await mocked(async (url) => String(url).endsWith("/auth/v1/user") ? Response.json({ id }) : Response.json([]), async () => {
    assert.equal((await GET(request("/api/dashboard/orders", "GET", undefined, true))).status, 401);
  });
});

test("JSON bodies are bounded even with missing or dishonest Content-Length", async () => {
  const { readJson } = await vite.ssrLoadModule("/lib/request-security.ts");
  for (const headers of [{}, { "Content-Length": "1" }]) await assert.rejects(readJson(new Request("https://paperless.test", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify({ payload: "x".repeat(1000) }) }), 100), (error) => error.status === 413);
  await assert.rejects(readJson(new Request("https://paperless.test", { method: "POST", body: "{}" })), (error) => error.status === 415);
  await assert.rejects(readJson(new Request("https://paperless.test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "[]" })), (error) => error.status === 400);
});

test("server upload validation detects MIME spoofing, size/dimension bombs and removes metadata", async () => {
  const { validatePhoto } = await vite.ssrLoadModule("/lib/image-validation.ts");
  assert.equal((await validatePhoto(new File([png], "photo.png", { type: "image/png" }))).mimeType, "image/png");
  for (const file of [new File(["<svg onload=alert(1)>evil</svg>"], "photo.png", { type: "image/png" }), new File([png], "photo.jpg", { type: "image/jpeg" }), new File([png], "photo.svg", { type: "image/png" }), new File([png.subarray(0, 40)], "photo.png", { type: "image/png" })]) await assert.rejects(validatePhoto(file), (error) => error.status === 415);
  const huge = Buffer.from(png); huge.writeUInt32BE(20000, 16);
  await assert.rejects(validatePhoto(new File([huge], "photo.png", { type: "image/png" })), (error) => error.status === 413);
  await assert.rejects(validatePhoto(new File([new Uint8Array(5242881)], "photo.png", { type: "image/png" })), (error) => error.status === 413);
  const text = Buffer.from("GPS=private-location");
  const chunk = Buffer.alloc(text.length + 12); chunk.writeUInt32BE(text.length); chunk.write("tEXt", 4); text.copy(chunk, 8);
  const tagged = Buffer.concat([png.subarray(0,33), chunk, png.subarray(33)]);
  assert.deepEqual(Buffer.from((await validatePhoto(new File([tagged], "photo.png", { type: "image/png" }))).bytes), png);
  for (const [path, mime] of [["public/social/invitation-preview.jpg", "image/jpeg"], ["public/images/builder-interactive-henna-hands.webp", "image/webp"]]) {
    const bytes = await readFile(new URL(`../${path}`, import.meta.url));
    assert.equal((await validatePhoto(new File([bytes], path, { type: mime }))).mimeType, mime);
  }
});

test("upload slots are immutable, replayable only for identical bytes, and queued before storage", async () => {
  const { storePhoto, privateMediaFolder } = await vite.ssrLoadModule("/lib/photo-storage.ts");
  let stage; let objects = 0; const sequence = [];
  await mocked(async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.pathname === "/rest/v1/media_cleanup" && init.method === "POST") {
      sequence.push("stage");
      if (stage) return Response.json({ code: "23505" }, { status: 409 });
      stage = { ...JSON.parse(init.body), delete_after: new Date(Date.now() + 7200000).toISOString(), uploaded: false };
      return Response.json({});
    }
    if (url.pathname === "/rest/v1/media_cleanup" && init.method === "PATCH") { stage.uploaded = true; return Response.json({}); }
    if (url.pathname === "/rest/v1/media_cleanup") return Response.json([stage]);
    if (url.pathname.startsWith("/storage/v1/object/")) { sequence.push("upload"); objects++; assert.equal(new Headers(init.headers).get("x-upsert"), "false"); return Response.json({}); }
    throw new Error(`Unexpected request ${url}`);
  }, async () => {
    const folder = await privateMediaFolder(id);
    assert.match(folder, /^media-[a-f0-9]{64}$/);
    const file = new File([png], "photo.png", { type: "image/png" });
    const one = await storePhoto(file, id, "hero:0", folder, true);
    const two = await storePhoto(file, id, "hero:0", folder, true);
    assert.equal(one.path, two.path); assert.equal(objects, 1); assert.deepEqual(sequence.slice(0,2), ["stage", "upload"]);
    const changed = Buffer.from(png); changed[45] ^= 1;
    await assert.rejects(storePhoto(new File([changed], "photo.png", { type: "image/png" }), id, "hero:0", folder, true), (error) => error.status === 409);
  });
});

test("submission idempotency preserves the original order and rejects changed retries", async () => {
  const { POST } = await vite.ssrLoadModule("/app/api/invitations/route.ts");
  const { createInitialInvitation } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const config = createInitialInvitation(); config.contact = { name: "Test Customer", phone: "58749327" };
  let stored; let commits = 0;
  await mocked(async (input, init = {}) => {
    const url = String(input);
    if (url.endsWith("consume_request_limit")) return Response.json(true);
    if (url.includes("/invitations?")) return Response.json(stored ? [stored] : []);
    if (url.endsWith("create_invitation_with_media")) {
      const value = JSON.parse(init.body); commits++;
      assert.match(value.p_slug, /-[a-f0-9]{6}$/);
      stored = { id: value.p_id, config: value.p_config, total_price: value.p_total_price };
      return Response.json([stored]);
    }
    throw new Error(url);
  }, async () => {
    const first = await POST(request("/api/invitations", "POST", { config }));
    const retry = await POST(request("/api/invitations", "POST", { config }));
    assert.equal(first.status, 201); assert.equal(retry.status, 200); assert.deepEqual(await first.json(), await retry.json()); assert.equal(commits, 1);
    const changed = structuredClone(config); changed.contact.name = "Different";
    assert.equal((await POST(request("/api/invitations", "POST", { config: changed }))).status, 409);
  });
});

test("rate-limited submissions and logins stop before processing and ignore X-Forwarded-For", async () => {
  const { POST } = await vite.ssrLoadModule("/app/api/invitations/route.ts");
  const login = await vite.ssrLoadModule("/app/api/admin-session/route.ts");
  const keys = [];
  await mocked(async (input, init) => { assert.match(String(input), /consume_request_limit$/); keys.push(JSON.parse(init.body).p_key); return Response.json(false); }, async () => {
    for (const fake of ["one", "two"]) {
      const input = request("/api/invitations"); input.headers.set("X-Forwarded-For", fake);
      assert.equal((await POST(input)).status, 429);
    }
    assert.equal(keys[0], keys[1]);
    assert.equal((await login.POST(request("/api/admin-session", "POST", { email: "admin@example.com", password: "synthetic" }))).status, 429);
  });
});

test("guest data drops contact/unknown keys and preserves legacy sections and safe venue links", async () => {
  const { publicInvitationConfig } = await vite.ssrLoadModule("/lib/public-invitation.ts");
  const { safeImageUrl } = await vite.ssrLoadModule("/lib/safe-url.ts");
  const { createInitialInvitation, createSection } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const { PublishedInvitation } = await vite.ssrLoadModule("/components/invitation/invitation-preview.tsx");
  const config = createInitialInvitation(); config.contact = { name: "Private Customer", phone: "58749327" }; config.secret = "private-extra";
  const legacy = createSection("journey"); legacy.items = []; legacy.fields = { event1Title: "Met here", event1Date: "2010", event1Text: "A memory" };
  config.sections.push(legacy);
  const event = config.sections.find((section) => section.type === "event-details"); event.items[0].mapUrl = "javascript:alert(1)"; event.fields.secret = "private-nested";
  const result = publicInvitationConfig(config);
  assert.doesNotMatch(JSON.stringify(result), /Private Customer|58749327|private-extra|private-nested|javascript:/);
  assert.equal(safeImageUrl("/images/%2e%2e/api/dashboard/orders"), null);
  const html = renderToStaticMarkup(React.createElement(PublishedInvitation, { config: result }));
  assert.match(html, /Met here/); assert.match(html, /A memory/);
});

test("public privacy projection preserves all section layouts across palettes, openings and heroes", async () => {
  const { publicInvitationConfig } = await vite.ssrLoadModule("/lib/public-invitation.ts");
  const { createInitialInvitation, createSection, normalizeInvitationConfig, paletteOptions, sectionDefinitions } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const { PublishedInvitation } = await vite.ssrLoadModule("/components/invitation/invitation-preview.tsx");
  for (const palette of paletteOptions) for (const opening of ["none", "envelope", "curtain"]) for (const hero of ["basic", "interactive"]) {
    const config = createInitialInvitation(); config.palette = palette.id; config.opening.type = opening; config.hero.type = hero; config.bismillah.enabled = true;
    config.contact = { name: "Private Client", phone: "58749327" };
    config.sections = Object.keys(sectionDefinitions).map((type) => createSection(type));
    const custom = config.sections.find((section) => section.type === "custom"); custom.fields.html = "<h2>Custom content</h2>"; custom.fields.css = "@media (max-width:600px){h2{font-size:20px}}";
    const render = (value) => renderToStaticMarkup(React.createElement(PublishedInvitation, { config: value }));
    assert.equal(render(publicInvitationConfig(config)), render(normalizeInvitationConfig(config)), `${palette.id}/${opening}/${hero}`);
  }
});

test("custom CSS cannot close its style element; iframe cannot execute scripts or submit forms", async () => {
  const { buildCustomSectionDocument, CustomSectionRenderer } = await vite.ssrLoadModule("/components/invitation/custom-section-renderer.tsx");
  const doc = buildCustomSectionDocument('<form action="/api/dashboard/orders"><script>alert(1)</script><img onerror="alert(1)" src="x"><a href="javascript:alert(1)">x</a></form>', '</style\n><img src=x onerror=alert(1)><style>h2 { color:red }');
  assert.equal((doc.match(/<style>/g) || []).length, 1); assert.equal((doc.match(/<\/style>/g) || []).length, 1);
  assert.doesNotMatch(doc, /<script|<form|<img[^>]*onerror|href="javascript:/i);
  assert.match(doc, /script-src 'none'/); assert.match(doc, /connect-src 'none'/); assert.match(doc, /form-action 'none'/);
  const html = renderToStaticMarkup(React.createElement(CustomSectionRenderer, { sectionId: "custom", sectionName: "Test", html: "<h2>Test</h2>", css: "", lazy: true }));
  assert.match(html, /sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"/); assert.doesNotMatch(html, /allow-scripts/); assert.match(html, /loading="lazy"/);
});

test("published lookups deduplicate within a request, refresh revisions and immediately honor undeploy", async () => {
  const { createRequestContext, runWithRequestContext } = await import("../node_modules/vinext/dist/shims/unified-request-context.js");
  const { getPublicInvitationBySlug } = await vite.ssrLoadModule("/lib/invitation-orders-server.ts");
  const { createInitialInvitation } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  const config = createInitialInvitation(); config.contact = { name: "Private Person", phone: "58749327" };
  let queries = 0; let revision = 1; let active = true;
  await mocked(async (input, init = {}) => {
    assert.ok(!init.method || init.method === "GET");
    const params = new URL(String(input)).searchParams; queries++;
    assert.equal(params.get("status"), "eq.active"); assert.match(params.get("active_until"), /^gte\./);
    if (!active) return Response.json([]);
    assert.ok(["id,revision", "config"].includes(params.get("select")));
    return Response.json([params.get("select") === "config" ? { config } : { id, revision }]);
  }, async () => {
    await runWithRequestContext(createRequestContext(), async () => {
      const [first, second] = await Promise.all([getPublicInvitationBySlug("cache-fixture"), getPublicInvitationBySlug("cache-fixture")]);
      assert.equal(first, second); assert.equal(queries, 2); assert.equal(first.config.contact.phone, "");
    });
    await runWithRequestContext(createRequestContext(), () => getPublicInvitationBySlug("cache-fixture")); assert.equal(queries, 3);
    revision++; config.hero.firstName = "Updated";
    const changed = await runWithRequestContext(createRequestContext(), () => getPublicInvitationBySlug("cache-fixture")); assert.equal(changed.config.hero.firstName, "Updated"); assert.equal(queries, 5);
    active = false;
    assert.equal(await runWithRequestContext(createRequestContext(), () => getPublicInvitationBySlug("cache-fixture")), null); assert.equal(queries, 6);
  });
});

test("admin lifecycle rejects stale revisions and preserves deployment values", async () => {
  const { PATCH, DELETE } = await vite.ssrLoadModule("/app/api/dashboard/orders/route.ts");
  const { createInitialInvitation } = await vite.ssrLoadModule("/lib/invitation-designer.ts");
  let order = { id, revision: 1, status: "pending", slug: "existing-shared-link", active_until: null, total_price: 1000, config: createInitialInvitation(), created_at: "2026-01-01", inactive_at: null, deployed_at: null };
  order.config.contact = { name: "Test Client", phone: "58749327" };
  let deleted = false;
  await mocked(async (input, init = {}) => {
    const url = String(input); const auth = authResponse(url); if (auth) return auth;
    if (url.includes("/invitations?")) return Response.json([order]);
    if (url.endsWith("save_invitation_version")) { const body = JSON.parse(init.body); assert.equal(body.p_revision, order.revision); order = { ...order, ...body.p_values, revision: order.revision + 1 }; return Response.json([order]); }
    if (url.endsWith("claim_media_cleanup")) return Response.json([]);
    if (url.endsWith("delete_invitation_version")) { const body = JSON.parse(init.body); assert.equal(body.p_revision, order.revision); deleted = true; return Response.json(true); }
    throw new Error(url);
  }, async () => {
    assert.equal((await PATCH(request("/api/dashboard/orders", "PATCH", { id, action: "deploy", revision: 0, activeUntil: "2099-01-01" }, true))).status, 409);
    const reserved = await PATCH(request("/api/dashboard/orders", "PATCH", {
      id, revision: order.revision, action: "save", config: order.config, slug: "examples",
    }, true));
    assert.equal(reserved.status, 400);
    assert.match((await reserved.json()).error, /reserved/);
    for (const action of ["deploy", "deploy", "deactivate", "deploy", "review", "save"]) {
      const result = await PATCH(request("/api/dashboard/orders", "PATCH", { id, revision: order.revision, action, activeUntil: "2099-01-01", ...(action === "save" ? { config: order.config } : {}) }, true));
      assert.equal(result.status, 200); assert.equal(order.slug, "existing-shared-link"); assert.equal(order.total_price, 1000);
      assert.equal(order.status, action === "deactivate" ? "inactive" : ["review", "save"].includes(action) ? "pending" : "active");
    }
    assert.equal((await DELETE(request(`/api/dashboard/orders?id=${id}&revision=${order.revision}`, "DELETE", {}, true))).status, 200); assert.ok(deleted);
  });
});
