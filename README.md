# Paperless Invites

A mobile-first digital invitation service with an editorial landing page, two independent invitation examples, and a guided invitation designer.

## Invitation designer

Open `/design-invitation` or choose **Design your invitation** on the landing page. The builder lets a customer:

- choose one of six colour palettes;
- choose no opening, an envelope opening, or a curtain opening;
- choose a basic or scratch-to-reveal hero and use a preset or uploaded photo;
- edit the four included invitation parts;
- add, repeat, reorder, duplicate, and remove extra parts;
- enter the event date, time, venue, address, and an optional Google Maps link;
- see an instant mobile-sized preview and live price; and
- save the design and photos as a private editable draft.

The existing Coastal Reverie and Rose Afterglow invitations remain separate from the builder. The traditional card has not been changed.

## Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run [`supabase/setup.sql`](supabase/setup.sql). It creates the invitation tables, indexes, private row policies, and the public `invitation-media` image bucket.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and the **service role key** from **Project Settings > API**. The service role key is server-only and must never be prefixed with `NEXT_PUBLIC_` or committed.

Saved rows are protected by Row Level Security. Browser requests go through validated server routes, and returning customers receive a random local edit token whose hash is stored in Supabase.

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
