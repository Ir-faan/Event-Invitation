# Paperless Invites

A mobile-first digital invitation service with an editorial landing page, two independent invitation examples, a guided invitation designer, and a private order dashboard.

## Invitation designer

Open `/design-invitation` or choose **Design your invitation** on the landing page. The builder lets a customer:

- choose one of six colour palettes;
- choose no opening, an envelope opening, or a curtain opening;
- choose a basic or scratch-to-reveal hero and use a preset or uploaded photo;
- edit the four included invitation parts;
- add, repeat, reorder, duplicate, and remove extra parts;
- enter the event date, time, venue, address, and an optional Google Maps link;
- see an instant mobile-sized preview and live price; and
- submit the design and photos once as a new order for review.

Customers cannot reopen or edit an order after submitting it. When submission succeeds, the designer confirms that the invitation was sent for processing and redirects to the home page. Only the protected administrator dashboard can change a saved order.

The existing Coastal Reverie and Rose Afterglow invitations remain separate from the builder. The traditional card has not been changed.

## Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/setup.sql`](supabase/setup.sql) for a new project, then [`supabase/media-commit-migration.sql`](supabase/media-commit-migration.sql) to install the atomic order/media functions.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and the **service role key** from **Project Settings > API**. The service role key is server-only and must never be prefixed with `NEXT_PUBLIC_` or committed.

Saved rows are protected by Row Level Security. Browser requests go through validated server routes. A signed, 30-minute upload permission exists only during a new submission; it is never saved in either database table and cannot edit an order. Images are staged in Storage first. Only after every image succeeds does a single PostgreSQL function insert the order and all of its photo rows together. A failed upload cannot leave a partial invitation or `invitation_media` entry. If an upload or save fails, the browser requests removal of staged blobs; exceptional network interruptions may leave unreferenced Storage objects, which should be reviewed periodically.

For an existing project, run [`supabase/dashboard-migration.sql`](supabase/dashboard-migration.sql) if it has not been applied already, then **run [`supabase/media-commit-migration.sql`](supabase/media-commit-migration.sql) before deploying this version**. It permits both the old and new code during rollout. Once the new code is deployed and working, run [`supabase/remove-obsolete-columns.sql`](supabase/remove-obsolete-columns.sql) to drop `edit_token_hash` and any remaining `updated_at` artifacts without altering existing orders. Keep `created_at`, `deployed_at`, and `inactive_at`: they still drive the dashboard and status history. Do not run the removal script before deployment; the old version still requires its edit-token column.

If you saw old media rows without an actual image, the read-only [`supabase/audit-existing-media.sql`](supabase/audit-existing-media.sql) lists them for review. It intentionally does not delete historical orders or photos automatically.

The browser converts iPhone HEIC/HEIF photos to JPEG for decoding, then encodes JPG, PNG, WebP and HEIC uploads to an optimized WebP (up to 1,800px, aiming below 900 KB). If an original JPG/WebP is already smaller than the optimized version, the smaller original is kept. New Storage object names are unique and immutable, with a one-year browser/CDN cache lifetime. Gallery photos load lazily. No paid image-transformation feature is required; customer images are already optimized before entering Storage. The public invitation itself is checked on each request so undeployment remains immediate, even though immutable image URLs can stay in a visitor's browser cache.

## Private order dashboard

Open `/dashboard` to be redirected to `/dashboard/login`. Sign in with the configured administrator username and password; the browser receives an HttpOnly, SameSite session cookie that expires after eight hours. Sign out from the dashboard header. The dashboard API and private previews require the same login, and modifications also check the request origin. There are no customer login or customer-edit credentials.

Add these server-side values to `.env.local` and to the deployed environment:

```bash
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=use-a-long-unique-password
# Optional (recommended): independent random secret, 32+ characters
DASHBOARD_SESSION_SECRET=generate-a-random-secret-with-at-least-32-characters
PUBLIC_SITE_URL=https://www.paperless-invites.com
```

The existing `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` work without further setup. Use a unique, strong password. An independent randomly generated `DASHBOARD_SESSION_SECRET` is recommended and rotates all existing sessions when changed; never expose either as a `NEXT_PUBLIC_` variable. Protect `/api/admin-session` with your hosting provider's IP-based login rate limit to discourage password guessing. For production, use HTTPS so the session cookie is Secure.

The dashboard lets the administrator:

- select one or several status cards to filter a searchable, sortable and paginated data table;
- see an order-value total calculated from the orders currently in the table;
- create, inspect, edit and permanently delete orders;
- duplicate orders needing review into independent new orders (including their uploaded photos and price), with a unique `-copy` invitation link;
- open every order in the same visual editor used by customers, with values pre-filled and all editing sections initially collapsed;
- directly edit customer details, event date, price and public slug;
- deploy without editing source code, producing a memorable route such as `/salma-and-sam`;
- choose or update the final active date, take a live invitation offline, move it back to review, and redeploy it later; and
- contact the customer through a direct WhatsApp shortcut.

The table shows each order ID, a copyable full invitation URL, and whether a custom part was requested. On narrow screens it becomes a set of readable order cards. New orders get a reserved slug immediately; a suggested URL for an older, still-unassigned order is reserved when you copy it or open the deployment dialog. Duplicating an older order without a saved slug still produces a `-copy` link. The eye icon and the editor's Preview saved invitation button open a private, password-protected full-page preview of the last saved version; the public URL does not work until deployment. Public and private invitation pages fill the desktop browser width and adapt to mobile screens, while the editor keeps a separate phone-sized preview. The configured `PUBLIC_SITE_URL` is used for copied links and live WhatsApp messages; on localhost the link defaults to `https://www.paperless-invites.com` so a local address cannot accidentally be sent to a customer. The successful deployment modal also offers a WhatsApp share button when the customer has a valid Mauritian mobile number.

For an order needing review, **Save edits** updates its content, customer details, price, and slug without publishing it. For a live order, the bottom button reads **Update live invitation**; it saves those values and applies the active-until date selected above in a single action. Both return to the orders table. **Move to review** takes a live invitation out of public access immediately and clears its active-until date, but keeps the reserved slug so it can be deployed again. **Undeploy** also stops public access immediately and files the order under Previous orders instead.

Public invitation routes check their status and active date on every request. Once the selected Mauritius date has passed, the route immediately becomes unavailable and the order moves to the inactive list the next time it is read.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local address shown in the terminal.

## Commands

```bash
npm run dev
npm run lint
npm test
npm run build
```

Booking and online payment features are outside the current scope. Payment remains outside the website: customers review the finished invitation before paying by MCB Juice or bank transfer.
