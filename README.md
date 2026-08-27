# Tower Estate

Enterprise real-estate and construction management for Kurdish, Arabic, and English teams. The application combines a public geospatial property portal with an authenticated operations dashboard, expense ledger, and printable receipt studio.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS, Radix/shadcn-compatible UI
- Supabase Auth, PostgreSQL/PostGIS, Storage, Row Level Security
- Leaflet/OpenStreetMap, Recharts, Framer Motion, `react-to-print`
- `next-intl` with English LTR and Kurdish/Arabic RTL routes
- Vercel deployment and GitHub CI/CD

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the browser-safe credentials in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The public map falls back to presentation inventory when Supabase is not configured. Admin routes require a valid Supabase Auth session.

## Database

Apply [`supabase/migrations/20260827000000_real_estate_core.sql`](supabase/migrations/20260827000000_real_estate_core.sql), then optionally load [`supabase/seed.sql`](supabase/seed.sql). The migration installs PostGIS, creates spatial indexes, enables RLS, grants the current Supabase Data API roles explicitly, and provisions a public `property-images` Storage bucket with authenticated write policies.

Disable public Auth sign-ups in Supabase and invite only company staff. Every authenticated account can access the operations workspace under the current policy model.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run build
```

## Routes

- `/{locale}` — full-screen public property map and filters
- `/{locale}/properties/{id}` — localized property detail
- `/{locale}/login` — Supabase Auth login
- `/{locale}/admin` — protected analytics
- `/{locale}/admin/properties` — map-assisted property CRUD
- `/{locale}/admin/expenses` — construction and operating expenses
- `/{locale}/admin/receipts` — payment capture and A4/80 mm printing

Supported locale prefixes are `en`, `ku`, and `ar`.
