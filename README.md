# Amioff

Amioff helps a private group of friends find the days and time periods when they are off together.

The project is currently in its foundation milestone. It includes a polished responsive preview, real date and overlap logic, local availability editing, filtering, tests, an installable web-app shell, and placeholder surfaces for the upcoming authenticated features. Availability changes are local and are not yet persisted.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the agreed product scope and delivery sequence.

## Local development

Requirements:

- Node.js 22 or newer.
- npm 10 or newer.

Install and run:

```bash
npm install
npm start
```

`npm start` launches Vite and opens the app in the default browser. Do not open `index.html` or `dist/index.html` directly: Vite applications require an HTTP server, and direct files use the incompatible `file://` protocol.

To run the server without automatically opening a browser:

```bash
npm run dev
```

Vite prints the local URL after startup, normally `http://localhost:5173/`.

## Quality checks

```bash
npm run check
```

The check command runs TypeScript, ESLint, Vitest, and the production build.

Individual commands are also available:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Supabase configuration

Copy `.env.example` to `.env.local` and set:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

The public anonymous key is safe to expose in the browser only when the database row-level security policies are enabled. Never add a Supabase service-role key or Google OAuth client secret to a `VITE_` variable.

Authentication and persistence are the next delivery milestone. The current preview does not require these values.

## Cloudflare Pages

Connect the eventual GitHub repository to Cloudflare Pages with:

- Build command: `npm run build`
- Build output: `dist`
- Production environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

`public/_redirects` provides the single-page application fallback, and `public/_headers` defines the baseline static security and cache headers.

## Source map

- `src/pages/CalendarPage.tsx`: interactive availability and overlap preview.
- `src/components/AvailabilityDialog.tsx`: explicit full-day, partial-day, and unavailable editor.
- `src/lib/appDefaults.ts`: empty-state group defaults for the local preview.
- `src/lib/dateKeys.ts`: timezone-safe date-key and rolling-window helpers.
- `src/lib/availability.ts`: aggregation, shared-period, and ranking rules.
- `src/types/domain.ts`: current domain model.
- `src/styles/index.css`: responsive Amioff visual system.
- `public/manifest.webmanifest` and `public/sw.js`: installable app shell.

## Current limitations

- Authentication and group membership are not connected yet.
- Preview changes live only in component state and reset on reload.
- Shortlist and membership actions are visual previews.
- Import buttons do not parse files yet.
- Specialized AMiON import handling needs anonymized sample exports.
