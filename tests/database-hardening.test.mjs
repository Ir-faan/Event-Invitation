import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Runs real PostgreSQL transactions locally. No network or production credentials.
const db = new PGlite();
after(() => db.close());
await db.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  create function auth.role() returns text language sql as $$ select current_setting('request.jwt.claim.role', true) $$;
  grant usage on schema auth to anon, authenticated, service_role;
  create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
`);
// PGlite supplies gen_random_uuid() natively, without the optional pgcrypto extension.
await db.exec((await readFile(new URL("../supabase/setup.sql", import.meta.url), "utf8")).replace("create extension if not exists pgcrypto;", ""));
for (const path of ["media-commit-migration.sql", "migrations/20260917_production_hardening.sql", "migrations/20260917_dashboard_pagination.sql"]) {
  await db.exec(await readFile(new URL(`../supabase/${path}`, import.meta.url), "utf8"));
}
await db.exec("select set_config('request.jwt.claim.role', 'service_role', false)");
const id = "11111111-1111-4111-8111-111111111111";
const config = { contact: { name: "Client", phone: "58749327" }, hero: { firstName: "Sara", secondName: "Sam", type: "basic", uploadedUrl: "" }, palette: "beige", opening: { type: "none" }, sections: [{ type: "event-details", fields: {}, items: [{date: ""}, {date: "2099-01-01"}] }] };

test("additive migrations are repeatable and keep existing rows", async () => {
  await db.query("insert into invitations(id, config) values ($1, $2)", [id, config]);
  for (const name of ["production_hardening", "dashboard_pagination"]) await db.exec(await readFile(new URL(`../supabase/migrations/20260917_${name}.sql`, import.meta.url), "utf8"));
  assert.equal((await db.query("select revision from invitations where id=$1", [id])).rows[0].revision, 1);
});

test("atomic counters limit callers and reset only after expiry", async () => {
  await db.exec("set role service_role");
  for (const expected of [true, true, false, false]) assert.equal((await db.query("select consume_request_limit($1,2,60) as allowed", ["a".repeat(64)])).rows[0].allowed, expected);
  await db.exec("reset role");
  await db.exec("update request_limits set expires_at=now()-interval '1 second'");
  assert.equal((await db.query("select consume_request_limit($1,2,60) as allowed", ["a".repeat(64)])).rows[0].allowed, true);
});

test("anonymous and ordinary Auth users cannot execute privileged RPCs or read queue/counters", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}; select set_config('request.jwt.claim.role','${role}',false)`);
    for (const query of ["select * from request_limits", "select * from media_cleanup", "select consume_request_limit('x',1,60)", "select * from claim_media_cleanup(1)", "select list_invitation_orders()", `select delete_invitation_version('${id}',1)`]) await assert.rejects(db.exec(query), /permission denied/);
    await db.exec("reset role; select set_config('request.jwt.claim.role','service_role',false)");
  }
  await db.exec("select set_config('request.jwt.claim.role','',false)");
  await assert.rejects(db.exec("select consume_request_limit('x',1,60)"), /Not authorized/);
  await db.exec("select set_config('request.jwt.claim.role','service_role',false)");
});

test("revision locking rejects stale edits and duplicate slugs roll back atomically", async () => {
  const rows = (await db.query("select * from save_invitation_version($1,$2,'[]',1)", [id, { total_price: 1700, slug: "preserved-old-link" }])).rows;
  assert.equal(rows[0].revision, 2);
  await assert.rejects(db.query("select * from save_invitation_version($1,$2,'[]',1)", [id, { total_price: 1 }]), /Order changed/);
  const other = "22222222-2222-4222-8222-222222222222";
  await assert.rejects(db.query("select * from create_invitation_with_media($1,$2,$3,1000,'[]')", [other, "preserved-old-link", config]), /duplicate key/);
  assert.equal((await db.query("select count(*)::int as n from invitations where id=$1", [other])).rows[0].n, 0);
  assert.equal((await db.query("select total_price from invitations where id=$1", [id])).rows[0].total_price, 1700);
});

test("committing media cancels its staging job; custom HTML/CSS references retain images", async () => {
  const photo = { storage_path: "legacy/photo.png", public_url: "https://storage.test/legacy/photo.png", slot: "hero:0", mime_type: "image/png", size_bytes: 68 };
  await db.query("insert into media_cleanup(storage_path,invitation_id) values($1,$2)", [photo.storage_path, id]);
  const custom = { ...config, sections: [{ type: "custom", fields: { html: `<img src="${photo.public_url}">`, css: "" }, images: [] }] };
  await db.query("select * from save_invitation_version($1,$2,$3,2)", [id, { config: custom }, [photo]]);
  assert.equal((await db.query("select count(*)::int as n from media_cleanup")).rows[0].n, 0);
  assert.equal((await db.query("select count(*)::int as n from invitation_media")).rows[0].n, 1);
  await db.query("select * from save_invitation_version($1,$2,'[]',3)", [id, { config }]);
  assert.equal((await db.query("select count(*)::int as n from invitation_media")).rows[0].n, 0);
  const jobs = (await db.exec("select * from claim_media_cleanup(10)"))[0].rows;
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].storage_path, photo.storage_path);
  assert.ok(jobs[0].lease_token);
  assert.equal((await db.exec("select * from claim_media_cleanup(10)"))[0].rows.length, 0);
  await db.exec("update media_cleanup set delete_after=now()-interval '1 second'");
  assert.notEqual((await db.exec("select * from claim_media_cleanup(10)"))[0].rows[0].lease_token, jobs[0].lease_token);
});

test("pagination searches beyond 250 rows with complete counts, stable pages and event dates", async () => {
  const legacyId = "33333333-3333-4333-8333-333333333333";
  await db.query("insert into invitations(id,config) values($1,$2)", [legacyId, { contact: { name: "Legacy malformed sections" }, hero: {}, sections: null }]);
  const legacy = (await db.query("select list_invitation_orders(1,10,'Legacy malformed',array['pending'],'created_at','desc') as result")).rows[0].result;
  assert.equal(legacy.orders[0].sectionCount, 0);
  await db.query("delete from invitations where id=$1", [legacyId]);
  await db.query("insert into invitations(config,total_price) select $1,1000 from generate_series(1,275)", [config]);
  const result = (await db.query("select list_invitation_orders(1,10,'',array['pending'],'created_at','desc') as result")).rows[0].result;
  assert.equal(result.total, 276);
  assert.equal(result.counts.pending, 276);
  assert.equal(result.totalValue, 276700);
  assert.equal(result.orders.length, 10);
  assert.equal(result.orders[0].eventDate, "2099-01-01");
  assert.equal(result.orders[0].config, undefined);
  const last = (await db.query("select list_invitation_orders(28,10,'',array['pending'],'created_at','desc') as result")).rows[0].result;
  assert.equal(last.orders.length, 6);
  const search = (await db.query("select list_invitation_orders(1,10,'preserved-old-link',array['pending'],'created_at','desc') as result")).rows[0].result;
  assert.equal(search.total, 1);
  assert.equal(search.orders[0].id, id);
});

test("delete checks revisions and transactionally preserves storage cleanup paths", async () => {
  await db.query("insert into invitation_media(invitation_id,storage_path,public_url,slot,mime_type,size_bytes) values($1,'delete/photo.png','https://storage.test/delete/photo.png','hero:0','image/png',68)", [id]);
  await assert.rejects(db.query("select delete_invitation_version($1,1)", [id]), /Order changed/);
  await db.query("select delete_invitation_version($1,4)", [id]);
  assert.equal((await db.query("select count(*)::int as n from invitations where id=$1", [id])).rows[0].n, 0);
  assert.equal((await db.query("select count(*)::int as n from media_cleanup where storage_path='delete/photo.png'")).rows[0].n, 1);
});
