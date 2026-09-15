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
3. Create `.env.local` (the example file is intentionally not checked in).
4. Add the project URL, a publishable (or legacy anon) API key, and the **service role key** from the Supabase **Connect** dialog / **Project Settings > API Keys**. The service role key is server-only and must never be prefixed with `NEXT_PUBLIC_` or committed.
5. Before deploying, run [`supabase/admin-auth.sql`](supabase/admin-auth.sql), then create and allowlist your administrator as described below.

Saved rows are protected by Row Level Security. Browser requests go through validated server routes. A signed, 30-minute upload permission exists only during a new submission; it is never saved in either database table and cannot edit an order. Images are staged in Storage first. Only after every image succeeds does a single PostgreSQL function insert the order and all of its photo rows together. A failed upload cannot leave a partial invitation or `invitation_media` entry. If an upload or save fails, the browser requests removal of staged blobs; exceptional network interruptions may leave unreferenced Storage objects, which should be reviewed periodically.

For an existing project, run [`supabase/dashboard-migration.sql`](supabase/dashboard-migration.sql) if it has not been applied already, then **run [`supabase/media-commit-migration.sql`](supabase/media-commit-migration.sql) before deploying this version**. It permits both the old and new code during rollout. Once the new code is deployed and working, run [`supabase/remove-obsolete-columns.sql`](supabase/remove-obsolete-columns.sql) to drop `edit_token_hash` and any remaining `updated_at` artifacts without altering existing orders. Keep `created_at`, `deployed_at`, and `inactive_at`: they still drive the dashboard and status history. Do not run the removal script before deployment; the old version still requires its edit-token column.

If you saw old media rows without an actual image, the read-only [`supabase/audit-existing-media.sql`](supabase/audit-existing-media.sql) lists them for review. It intentionally does not delete historical orders or photos automatically.

Selected JPG, PNG and WebP photos appear immediately in the local preview. The 5 MB per-photo limit is checked before selection is accepted; optimization begins only when the invitation is saved. At that point the browser converts iPhone HEIC/HEIF photos for decoding and encodes uploads to an optimized WebP (up to 1,800px, aiming below 900 KB). If an original JPG/WebP is already smaller than the optimized version, the smaller original is kept. New Storage folders use `<invitation-link>-<order-id>-<customer-name>` (using the current edited link and customer name, normalized to URL-safe lowercase text), and object names remain unique and immutable with a one-year browser/CDN cache lifetime. Gallery photos load lazily. No paid image-transformation feature is required; customer images are already optimized before entering Storage. The public invitation itself is checked on each request so undeployment remains immediate, even though immutable image URLs can stay in a visitor's browser cache.

## Private order dashboard

Open /login to sign in with a Supabase Auth email and password. /dashboard redirects guests to /login and takes signed-in administrators to the orders table. /dashboard/login redirects to /login for old bookmarks. Supabase verifies passwords and session tokens; an Auth account **also must** have a row in the server-only dashboard_admins allowlist before it can access orders. Signup is not offered on this website. Supabase access and refresh tokens are held in HttpOnly, SameSite cookies; the access token is refreshed automatically and the refresh cookie lasts up to seven days on that browser. The server still checks the Auth user and admin allowlist before every protected request. Signing out revokes the refresh session. Administrator actions still check the request origin.

Supabase returns `created_at` as a UTC timestamp. The orders table deliberately displays the same instant in Mauritius time (UTC+4), so an order placed late in the UTC day can show the following calendar date in the dashboard.

Before deploying this release to an existing Supabase project:

1. Run [supabase/admin-auth.sql](supabase/admin-auth.sql) in Supabase SQL Editor. Keep any previously required [media-commit-migration.sql](supabase/media-commit-migration.sql) in place. Check the final query: if an older invitation uses the slug login, change its slug first so its URL will not conflict with /login.
2. In Supabase **Authentication > Sign In / Providers**, enable Email and disable **Allow new users to sign up** if you do not need customer accounts. In **Authentication > Users**, use **Add user** to create a confirmed administrator with your email and a strong, unique password (or send yourself an invite and complete it).
3. Return to SQL Editor. Uncomment the insert in admin-auth.sql, replace admin@example.com with the **exact email you created**, and run that insert. Confirm that it returns one user_id. Only users in this table can open the dashboard.
4. Set these values in the deployed environment and your local `.env.local` (no admin password in environment variables):

    ```bash
    SUPABASE_URL=https://YOUR_PROJECT.supabase.co
    SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
    SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
    PUBLIC_SITE_URL=https://www.paperless-invites.com
    ```

   If your project has an older anon key instead, SUPABASE_ANON_KEY works in place of SUPABASE_PUBLISHABLE_KEY. Never expose SUPABASE_SERVICE_ROLE_KEY in browser code or commit either secret to GitHub.
5. After the deployment, visit /login and sign in. Remove any old DASHBOARD_USERNAME, DASHBOARD_PASSWORD, and DASHBOARD_SESSION_SECRET values from your host; they are no longer used. Old cookies from the previous login cannot authenticate this version.

The image upload code uses the locked heic-to dependency. If you saw a Vite cannot resolve heic-to error or a dynamically imported designer module error, stop the dev server and run npm ci, then npm run dev; predev now also restores missing packages automatically before Vite starts. If npm ci fails, check network/registry access and the Node version (22.13+), then retry. The same missing dependency was responsible for both screens failing to load.

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

The table shows each order ID, a copyable full invitation URL, and whether a custom part was requested. On narrow screens it becomes a set of readable order cards. New orders get a reserved slug immediately; a suggested URL for an older, still-unassigned order is reserved when you copy it or open the deployment dialog. Duplicating an older order without a saved slug still produces a `-copy` link. The eye icon and the editor's Preview saved invitation button open a private, password-protected full-page preview of the last saved version; the public URL does not work until deployment. Public and private invitation pages use the same centred invitation canvas on desktop and adapt to fill mobile screens, while the editor keeps a separate phone-sized preview. The configured `PUBLIC_SITE_URL` is used for copied links and live WhatsApp messages; on localhost the link defaults to `https://www.paperless-invites.com` so a local address cannot accidentally be sent to a customer. The successful deployment modal also offers a WhatsApp share button when the customer has a valid Mauritian mobile number.

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
