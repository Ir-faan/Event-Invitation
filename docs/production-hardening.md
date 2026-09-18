# Production hardening: review and rollout

This branch starts at main `2d650fda21c5a9b0c6d0a5690b20642461cbcf82`.
The recovered complete audit covered `Existing-Template-Design` commit
`99a47660b31c5f444631e69e20c1d582b59abaab`. Those trees differ: the audited
development branch was **not identical to the fetched main**. Findings were
rechecked against main, and the development branch was not merged wholesale.
The existing generic social JPEG was reused from that development commit as a
targeted privacy fix. Review any other missing development features separately.

## Required rollout order

No production database changes or deployment were performed during this work.
Do not deploy the application code before its database prerequisites.

1. Back up and inspect the destination schema, RLS policies, Storage permissions,
   current media references, and administrator allowlist. The repository schema
   was inspected; a live production schema/data export was not available here.
2. Confirm the existing `media-commit-migration.sql` and `admin-auth.sql` have
   already been applied. Historical `setup.sql`, `dashboard-migration.sql`, and
   `remove-obsolete-columns.sql` contain legacy changes and are **not** part of
   this release's production migration procedure.
3. Apply `supabase/migrations/20260917_production_hardening.sql`.
4. Apply `supabase/migrations/20260917_dashboard_pagination.sql`.
5. Deploy the reviewed application branch with its existing server-only
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`
   (or `SUPABASE_ANON_KEY`), optional `SUPABASE_STORAGE_BUCKET`, and HTTPS
   `PUBLIC_SITE_URL`. Never expose service credentials through `NEXT_PUBLIC_*`.
6. Confirm the generated Worker configuration's five-minute cron is registered
   on the host and its `scheduled` handler can reach Supabase. It drains up to
   50 due objects per run; failed jobs retain a five-minute lease and retry.
   Monitor queue age and growth. Without the schedule, abandoned uploads remain
   queued; admin saves/deletes opportunistically drain a smaller batch.
7. Verify trusted ingress overwrites `CF-Connecting-IP`. The application trusts
   that Cloudflare header only, never arbitrary `X-Forwarded-For`. Missing ingress
   information deliberately shares the conservative `unknown-ingress` bucket.
   A different host must supply an equally trustworthy source before rollout.
8. Run the staging browser checklist below against a disposable Supabase project.
   Confirm public page/asset headers and private route cache behavior on the real
   host. Do not enable shared HTML caching that bypasses active/revision checks.

The migrations add `invitations.revision`, two private tables, service-only RPCs,
triggers and indexes. They do not remove columns, rename storage objects, rewrite
customer configuration, or rotate existing links. Old RPC signatures remain.
The revision trigger also covers writes from an older application release.
Index creation can briefly lock writes; schedule it appropriately for large
databases. A code rollback can leave these additive objects in place, but loses
the new application protections. Do not delete queued jobs as a rollback step.

## Audit disposition

| Audit ID | Original problem and risk | Implementation / main files |
| --- | --- | --- |
| SEC-001 | One signed public slot could mint unlimited objects, causing storage abuse/orphans. | `photo-storage.ts`, `media-cleanup.ts`, upload routes and hardening SQL: one deterministic immutable path per public slot; content digest and durable reservation precede upload. Same-byte retries recover; different bytes conflict. |
| SEC-002 | Anonymous submissions lacked throttling/idempotency; bots and retries could fill orders. | `rate-limit.ts`, public routes, designer: atomic database counters across isolates; HMAC-derived submission IDs from a random client idempotency key; retry returns the existing result, changed payload returns 409. |
| SEC-003 | Multipart MIME could disguise arbitrary files. | `image-validation.ts`, shared `storePhoto`: check JPEG/PNG/WebP structure, signature, declared MIME, extension, maximum 5 MB, 12,000-pixel edge and 40 MP. Reject SVG/unsupported/animated WebP. This is structural validation, not a complete codec decode. |
| SEC-004 | Handler/page permissions depended on the proxy alone. | `admin-guard.ts`, all dashboard API methods, dashboard and private preview pages: independently verify Supabase Auth user and `dashboard_admins`; mutations also enforce same origin. Proxy forwards refreshed cookies to the second check. |
| SEC-005 | Login lacked app-level throttling. | Admin-session route limits IP and hashed account attempts before Auth processing. Database/provider failures fail closed. |
| SEC-006 | No outer application security headers. | `security-headers.ts`, `next.config.ts`, Worker: nosniff, frame protection, no-referrer, restricted permissions, HSTS, compatible base/object/form/frame CSP; private/API responses no-store. Inline React streaming remains supported. |
| SEC-007 | Arbitrary venue URL could become a dangerous clickable link. | `safe-url.ts`, config validation, EventCard/public DTO: HTTPS only, no credentials/control characters/backslashes; unsafe saved links fall back to the venue search. |
| SEC-008 | Size check ran after parsing a potentially huge body. | `request-security.ts`: stream byte bounds independent of Content-Length before JSON/multipart parsing; expected Content-Type and object shape; safe 400/413/415 responses. |
| SEC-009 | Custom HTML/CSS can request external tracking resources. | Intentionally retained HTTPS images/fonts/links to preserve authored sections. No-referrer, HTML allowlist, iframe/CSP isolation and no scripts limit access. External hosts can still observe requests; an asset allowlist would be a separately reviewed content-policy change. |
| PRIV-001 | Names-only generated links were enumerable. | New normal/duplicate links carry a 128-bit HMAC suffix unrelated to the public name/internal UUID. Existing links and explicit admin custom slugs remain compatible. Older/custom names-only URLs remain guessable. |
| PRIV-002 | Small originals could preserve EXIF/GPS. | `photo-upload.ts` always re-encodes new browser uploads. Server independently strips private EXIF/XMP/IPTC/text metadata. Minimal JPEG orientation alone is retained for correctly displaying duplicated legacy camera images. Existing stored bytes are not rewritten. |
| PRIV-003 | Storage paths exposed customer names/order UUIDs. | `private-media-path.ts`, storage/upload/duplicate routes: opaque HMAC folders for new objects. Legacy paths and committed folders from a prior signing key remain recognized. Existing public URLs are unchanged. |
| PRIV-004 | Link-preview metadata exposes couple names. | Kept as intended invitation sharing behavior. Generic branded JPEG replaces the uploaded-photo fallback; contact details never go into public config/metadata. |
| REL-001 / REL-002 / REL-005 | DB deletion/removal could lose the only cleanup path; failures had no durable retry. | Transactional media triggers queue removals before commit; staging rows exist before upload; leased scheduled cleanup retries. Cancellation does not race and delete a committed photo. SQL retains images referenced by custom HTML/CSS. |
| REL-003 | Stale tabs silently overwrote whole configs. | Revision field/trigger and locking save/delete RPCs; every admin save/lifecycle/delete carries the version. Conflicts return 409 with a reload message. |
| REL-004 | Check-then-write slug allocation raced. | Opaque deterministic generation removes allocation probes; existing unique index remains authoritative and duplicate/conflicting writes return 409. Manual custom slugs retain their UX availability check plus DB enforcement. |
| DB-001 | Guest lookup fetched admin-only columns. | `invitation-orders-server.ts` fetches only identity/revision gate then config; `public-invitation.ts` explicitly removes contact and unknown fields before HTML/RSC serialization. This also fixes confirmed contact-data exposure on current main, beyond the old audit. |
| DB-002 | Guest GET could write expiration status. | Guest reads only filter status/date; administrative reads perform expiration maintenance. |
| PERF-001 | Public page/metadata repeated full database reads. | Request-scoped promise deduplication; bounded 16-entry/5-minute cache of sanitized immutable revisions. A cold request uses two narrow reads; a warm request uses one identity/revision read. Every new request rechecks active/expiry, preserving immediate undeploy. Dynamic rendering is deliberately retained. |
| SCALE-001 | Dashboard stopped at 250 rows and filtered full configurations in-browser. | Service-only pagination RPC returns summaries plus full filtered totals/status counts; debounced server filtering/sorting and stale-response protection in dashboard. Detail config fetched only when opening an order. |
| PERF-002 | Typing rerendered all sections. | Deferred preview config and memoized unchanged sections reduce avoidable work; form/editor architecture retained. Preview focus also follows deferred section ordering. This is a targeted reduction, not a complete editor state rewrite. |
| PERF-003 | Every source edit reloaded the entire custom iframe. | Renderer debounces source 350 ms and memoizes the sanitized document. Editing still reloads the document after a pause to preserve isolation and viewport media queries. |
| PERF-004 | ResizeObserver measured and wrote in a feedback-prone loop. | Measurements/writes scheduled outside the observer via requestAnimationFrame, 2px tolerance, bounded updates and 20,000px maximum height; observer/image/font/RAF cleanup. Phone height seeds the initial viewport. Pathological viewport-relative CSS may hit the safety bound. |
| PERF-005 | Public invitations hydrate shared UI and load broad designer CSS. | Broad server/client or CSS extraction deferred: it touches shared animations, scratch/reveal, typography and mobile rules and was too risky without browser regression coverage. No claim of complete bundle optimization. |
| PERF-006 | All preparation and uploads were sequential. | Keep CPU-heavy decoding/compression serial to contain memory; upload two photos concurrently, await both before failure handling, and cache results by slot for retries/same file in multiple slots. |
| PERF-007 | All custom frames eagerly loaded. | Published/private full-page invitations lazy-load custom frames; designer remains eager. |
| PERF-008 | Landing DOM helpers mounted on every route. | Move landing helpers to home only; put the second card's existing destination directly in its Link and remove obsolete router helper. Decorative countdown images lazy-load/async decode. |
| DEP-001 / DEP-002 | React/RSC and Next were within security-advisory ranges. | Compatible React/RSC, Next, Vite, Cloudflare tooling and affected transitive updates; see versions below. Vinext stays at 0.0.50 to avoid an unrelated prerelease/major runtime migration. |

Additional defenses include CSS `<` escaping before `srcDoc` interpolation,
duplicate slot/section-ID rejection, strict calendar-date validation, consistent
generic provider failures, independent storage paths for duplicated orders, and
preventing form edits while a save/lifecycle operation is in flight. Map embeds
also receive no invitation URL in the HTTP referrer. Customer
custom-source submissions remain forbidden. Administrator HTML is sanitized
before persistence and again before preview/public rendering. The iframe keeps
`allow-same-origin` for parent measurement but **never** `allow-scripts`; its CSP
blocks scripts, connections, nested frames, objects, base changes and forms.
Links open separately with noopener/noreferrer. Custom sections remain available.

## Dependency changes

| Direct package | Before → after | Reason |
| --- | --- | --- |
| react, react-dom, react-server-dom-webpack | 19.2.6 → 19.2.8 | Security fixes including RSC advisory GHSA-wx67-qw84-cm4g. |
| next, eslint-config-next | 16.2.6 → 16.3.5 | Patched Next security ranges and matching lint config; same major. |
| vite | 8.0.13 → 8.0.16 | Compatible security fixes. |
| @cloudflare/vite-plugin | 1.37.1 → 1.47.0 | Patched stable tooling aligned with Wrangler; avoid newer alpha Miniflare line. |
| wrangler | 4.92.0 → 4.114.0 | Compatible Cloudflare toolchain security updates. |
| @electric-sql/pglite (dev only) | added 0.5.8 | Real isolated PostgreSQL regression tests for migrations, roles, locking, cleanup and pagination; never shipped to the application. |

Overrides pin `vinext`'s `image-size` to 2.0.3, `sharp` to 0.35.4 and `undici`
to 7.29.0 to close transitive advisories while preserving the current framework.
Compatible lockfile updates also patch Babel core 7.29.7, baseline-browser-mapping
2.11.24, brace-expansion 1.1.21, browserslist 4.29.0, fast-uri 3.1.8,
fflate 0.7.5 and js-yaml 4.3.2 and their affected dependency chains. No direct
runtime dependency was removed. npm audit went from 21 reported issues
(1 critical, 16 high, 2 moderate, 2 low) to zero at validation time.

Primary advisory references:
[React RSC](https://github.com/react/react/security/advisories/GHSA-wx67-qw84-cm4g),
[Next Windows RCE](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36),
[Next AVIF handling](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4).
An installed affected dependency is not proof that every advisory's exploit path
was reachable on this Cloudflare deployment.

## Confirmed dead code removed

- `components/landing-experience.tsx`: abandoned 561-line implementation, no
  static/dynamic import, route, or configuration reference after graph/search
  review. Current landing imports `LandingExperienceRefresh`.
- Its file-specific ESLint override and unused `ChevronDown` import in the
  current landing implementation.
- `components/template-card-router.tsx`: its sole behavior is now the same
  destination directly in the rendered card Link, removing the post-mount DOM
  rewrite and avoiding conflicting router click behavior.
- `removeStoredPhotos` in `media-submission.ts`: no remaining callers; replaced
  by durable staged/transactional cleanup.
- Legacy media-folder construction helpers and obsolete browser upload identity
  fields (`link`/`customerName`); legacy path recognition remains for existing
  stored objects.
- Obsolete dashboard client filtering/sorting and immediate best-effort cleanup
  code replaced by server pagination and transactional queue processing.

No public image, font, template route, shared stylesheet, old storage object or
legacy database column was removed. Repository searches cannot prove absence of
database-stored references. Legacy asset/path helpers are kept for compatibility.

## Validation and its limits

Run `npm ci`, `npm run typecheck`, `npm run lint`, and `npm test` (which runs the
production build and all tests). The tests use synthetic provider responses and
an in-memory real PostgreSQL engine; no tests connect to production Supabase.

The suite covers landing/designer/admin shells, all palette artwork, preserved
pricing, mobile/desktop shared markup and responsive style guards, both example
invitations, openings and scratch/reveal code paths, section ordering/custom
source, WhatsApp/social metadata, login/admin membership/HttpOnly refresh,
upload failure/retry/storage immutability, atomic create/duplicate/save/delete,
deploy/update/undeploy/redeploy/review, private DTOs, bounded bodies, MIME spoofing,
rate limits, permission denial, revision conflicts, cleanup leasing, pagination
beyond 250 rows, cache refresh and immediate undeploy.

The cloud browser could not reach this local development endpoint
(`ERR_BLOCKED_BY_CLIENT`). Therefore this pass does **not** certify real mobile,
tablet, desktop or Safari/HEIC interactions, visual pixels, animation smoothness,
browser console cleanliness, host headers or live Supabase policies. Existing
responsive rules and visual layouts are retained; staging browser QA is required.
Build warnings for the large lazy HEIC codec chunk remain. Lint has no errors;
native image and deliberate full-navigation warnings remain to avoid unnecessary
image-loader/navigation behavior changes. Performance improvements are structural
and query-count tested; no real-user/Lighthouse speedup was measured.

Staging checklist (disposable data, before production):

- At 390px, 768px and desktop widths, inspect landing, designer and both example
  invitations; all six palettes; Bismillah; none/envelope/curtain; basic/interactive
  hero; scratch, replay, countdown and image load/layout stability.
- Exercise timeline, event details/maps, important notes, special message,
  seating, day programme, memory, gallery and custom section; add/duplicate/remove
  and move up/down; verify phone and desktop previews match saved order.
- Upload real JPG/PNG/WebP and iPhone HEIC; inspect orientation, compression,
  multi-image progress, removal, failed network retry and Save Design validation.
- Log in, refresh the session, list/search/page >250 fixture orders, edit,
  duplicate, delete, prepare link, deploy/update/undeploy/redeploy/review; verify
  WhatsApp links, metadata and guest visibility on each transition.
- Test custom responsive HTML/CSS, malicious script/attribute/style breakout,
  remote font/image load and no ResizeObserver/hydration console errors.
- Deny anonymous/ordinary-user direct REST/Storage access, confirm uploads are
  server-only, inspect private HTML/RSC for contact leakage, and observe scheduled
  cleanup after a failed upload and a deleted order.

## Remaining operational and architectural concerns

- Migrations and the deployed cron must be applied/verified before this code can
  run successfully. Missing RPCs fail closed. Production RLS, Storage policies,
  Auth settings, deployed secrets and backups were not independently verified.
- Existing public links and public Storage URLs are retained for compatibility.
  Undeploy hides the invitation route, but cannot recall images already shared,
  cached or downloaded. New opaque URLs are bearer links, not guest login.
- Fixed limits are currently: submission requests 40/15m/IP, starts 10/15m/IP,
  starts 500/day/global, public photo calls 80/15m/IP and 64/30m/submission,
  admin photos 150/15m/IP, login 10/15m/IP and 20/15m/account. Tune with traffic
  evidence. Distributed bots can consume the global quota; host WAF/challenge
  controls and alerts remain useful. No CAPTCHA service was introduced.
- The upload parser rejects malformed containers and strips common private
  metadata; it is not an antivirus scanner or full image codec validator. Legacy
  originals are not rewritten. CPU-heavy HEIC is still a large lazy browser chunk.
- Custom external resources can track requests, and arbitrary HTTPS links may
  lead to an untrusted destination. No scripts/session access is granted to the
  custom document. Very tall/pathological viewport CSS can reach the height cap.
- Public rendering still hydrates shared preview components and imports broad
  CSS. Dashboard search still scans JSON-derived summaries; much larger datasets
  may justify measured indexing/denormalization later. Vinext remains pre-1.0.
- Historical orphan Storage objects predate the queue and need read-only inventory
  and explicit reconciliation; no uncertain legacy object is deleted automatically.

The branch is a tested hardening change set for review, not an unconditional
production-readiness certificate. Complete the operational and browser gates
before a production rollout.
