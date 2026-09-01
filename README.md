# Event Invitations

A production-oriented foundation for creating personalized digital invitations. Customers choose a fixed design, edit approved content and colours in a live preview, submit their invitation, and wait for the administrator to review and publish it.

## Included

- Premium responsive landing page
- Heritage Night, Rose Garden, and Midnight Vows templates
- Fixed-field live invitation editor
- Event date and time stored in D1
- Customer submission and request references
- Single-administrator username/password access
- Admin review, preview, and publish workflow
- Private, random public invitation URLs
- Mobile-first published invitations

The advanced section builder, RSVP, media uploads, calendar integration, and multi-event timelines are intentionally outside this foundation.

## Local setup

Requirements: Node.js 22.13 or newer.

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:setup
npm run dev
```

Update the three values in `.dev.vars` before using the admin panel. Open `/admin/login` to sign in.

## Commands

```bash
npm run dev          # local development
npm run db:setup     # apply local database migrations
npm run db:generate  # generate a new migration after schema changes
npm run lint         # lint the codebase
npm test             # build and run tests
npm run build        # production build
```

## Data model

Event dates are stored as ISO `YYYY-MM-DD` values. Keeping the calendar date separate from timezone conversion ensures the selected event day is displayed consistently in every browser.

Admin credentials and the session-signing secret are runtime environment variables and are never committed to source control.
