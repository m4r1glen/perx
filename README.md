# Perx

Perx is a JunctionX Tirana 2026 / TeamSystem challenge MVP: an AI-assisted employee benefits marketplace for Albania.

## Problem

Employee benefits are often generic, manual to administer, and disconnected from the providers employees actually use. Employers need a simple way to manage allowances and approvals, employees need a clear marketplace, and providers need a reliable redemption channel.

## Solution

Perx connects three actors in one demo-ready flow:

- Employee: discovers benefits, builds selections, receives vouchers, gifts benefits, and uses an AI concierge.
- Employer/HR: manages budget, team access, approvals, simulated payment, points, and benefit usage.
- Provider: lists offers, scans vouchers, and sees redeemed demand.

## Core Demo Features

- Role-based employee, employer, and provider dashboards.
- Demo account switcher for judges when `VITE_ENABLE_DEMO_MODE=true`.
- Marketplace offers, maps, bundles, vouchers, QR signing, and provider redemption.
- Employer approval flow with backend authorization.
- AI concierge powered by a Supabase Edge Function and Gemini when configured.
- Simulated hackathon payment/test card flow for employer onboarding.
- Demo monthly allowance: `30,000 ALL`.

## Tech Stack

- React 19, Vite, TanStack Router/Start, TanStack Query
- Supabase Auth, Postgres, RLS, Storage, Edge Functions
- Tailwind CSS, Radix UI, lucide-react
- Gemini API for the concierge Edge Function

## Setup

Install dependencies with npm:

```bash
npm ci
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill the required values from Supabase and any optional demo integrations.

## Environment Variables

Client:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_GOOGLE_MAPS_BROWSER_KEY`
- `VITE_GOOGLE_MAPS_TRACKING_ID`
- `VITE_ENABLE_DEMO_MODE`

Server / Supabase functions:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `VOUCHER_SIGNING_SECRET`

## Supabase Setup

Apply the migrations in `supabase/migrations`. The seed migrations include disposable demo users for the hackathon demo. Do not use these credentials in a production database.

Set Edge Function secrets:

```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set VOUCHER_SIGNING_SECRET=...
supabase secrets set SUPABASE_ANON_KEY=...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

Deploy functions:

```bash
supabase functions deploy concierge
supabase functions deploy voucher-sign
supabase functions deploy voucher-verify
```

## Run Locally

```bash
npm run dev
```

## Build

```bash
npm run lint
npm run build
```

## Demo Flow For Judges

Enable demo mode:

```env
VITE_ENABLE_DEMO_MODE=true
```

Use the demo switcher to enter:

- Employee dashboard: choose benefits, view allowance, generate vouchers.
- Employer dashboard: approve a pending benefit request and run simulated payment.
- Provider dashboard: scan or verify a voucher.

Demo credentials are disposable and exist only for the hackathon seed data. The shared demo password is documented in source for the demo switcher and should be rotated or removed outside the demo database.

## Implemented vs Simulated

Implemented:

- Auth, role dashboards, Supabase data model, RLS policies, employer approval RPC, voucher signing/verification, provider redemption, AI concierge function, and provider/employee/employer UI flows.

Simulated for the hackathon:

- Employer payment collection/test card UX.
- The fallback monthly allowance of `30,000 ALL` for demo accounts.
- Some seeded marketplace/provider data.

## Publishing Notes

Do not commit real `.env` files, `node_modules`, build output, or generated local metadata. Use `.env.example` for required configuration.
