import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("template slugs and defaults are unique", async () => {
  const { templates } = await vite.ssrLoadModule("/lib/invitations/templates.ts");
  assert.equal(templates.length, 3);
  assert.equal(new Set(templates.map((template) => template.slug)).size, templates.length);
  for (const template of templates) {
    assert.match(template.defaultContent.eventDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(template.defaultContent.primaryColor, /^#[0-9a-f]{6}$/i);
  }
});

test("formats stored ISO dates without timezone drift", async () => {
  const { formatEventDate, formatEventTime } = await vite.ssrLoadModule("/lib/invitations/templates.ts");
  assert.equal(formatEventDate("2026-12-05"), "Saturday, 5 December 2026");
  assert.equal(formatEventTime("18:30"), "6:30 pm");
});

test("validates invitation submissions", async () => {
  const { invitationSubmissionSchema } = await vite.ssrLoadModule("/lib/invitations/schema.ts");
  const valid = invitationSubmissionSchema.safeParse({
    templateSlug: "heritage-night", customerName: "Test Customer", phone: "example", email: "",
    personOneName: "Your Name", personTwoName: "Their Name", intro: "Together with their families, they invite you.",
    message: "We would be delighted to celebrate this beautiful day with you.", eventDate: "2026-12-05",
    eventTime: "18:30", venue: "Your Celebration Venue", address: "Add the event address",
    primaryColor: "#0c302d", secondaryColor: "#f7ead2", accentColor: "#d8a957",
  });
  assert.equal(valid.success, true);
});
