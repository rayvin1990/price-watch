# PriceWatch - Subscription Price Tracker

Automatically track price changes on your SaaS subscriptions and recurring services.

## Project Structure

```
price-watch/
├── extension/          # Chrome Extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js   # Service worker (checking, notifications, sync)
│   ├── content.js      # Content script (auto price detection)
│   ├── popup/          # Popup UI
│   └── options/        # Full dashboard
├── saas/               # SaaS Backend (Next.js)
│   ├── src/
│   │   ├── app/        # Pages + API routes
│   │   ├── components/ # React components
│   │   └── lib/        # Utils (Supabase, Stripe)
│   └── supabase/       # Database schema
└── README.md
```

## Quick Start

### 1. Load the Chrome Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → select `extension/` directory

### 2. Deploy the SaaS Backend

You'll need:
- **Clerk** → Auth (https://clerk.com)
- **Supabase** → Database (https://supabase.com)
- **Stripe** → Payments (https://stripe.com)
- **Vercel** → Hosting (https://vercel.com)

```bash
cd saas
cp .env.local.example .env.local
# Fill in env vars
npm install
npm run dev
```

### 3. Initialize Database

Run `supabase/schema.sql` in the Supabase SQL Editor.

## Tech Stack

| Layer | Tech |
|------|------|
| Extension | Manifest V3, Vanilla JS |
| Frontend | Next.js 14, Tailwind CSS |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe |
| Hosting | Vercel |

## Pricing

| Plan | Price | Limits |
|------|------|------|
| Free | $0 | Track 3 subscriptions |
| Pro | $5/mo | Track 50 subscriptions + email alerts |
| Pro Yearly | $49/yr | Same, save 2 months |
