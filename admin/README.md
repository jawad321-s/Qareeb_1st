# Qareeb Admin Dashboard

Enterprise admin console for the Qareeb platform — **Next.js 15 · TypeScript ·
Tailwind CSS · TanStack Table · Recharts · Framer Motion**.

## Run

```bash
npm install
cp .env.example .env.local   # add Firebase keys when wiring the backend
npm run dev                  # http://localhost:3000
```

Sign in at `/login` (mock — any credentials) to enter the dashboard.

## Pages

| Route | Description |
|---|---|
| `/` | Overview — KPI cards, revenue area chart, category pie, activity feed, verification queue |
| `/users` | All accounts — sortable, filterable, paginated TanStack table |
| `/artisans` | Verification queue — approve/reject with Framer Motion transitions |
| `/requests` | All service requests table |
| `/analytics` | Revenue / demand charts, category share, status breakdown |
| `/categories` | Service catalog grid |
| `/complaints` | Dispute resolution list |
| `/subscriptions` | Plan distribution + MRR |
| `/settings` | Platform config + roles & permissions |

## Structure

```
admin/
├── app/
│   ├── layout.tsx            # root
│   ├── login/                # auth screen (outside dashboard shell)
│   └── (dashboard)/          # sidebar + topbar shell, all admin pages
├── components/
│   ├── layout/               # sidebar, topbar
│   ├── charts/               # Recharts wrappers (client)
│   └── ui/                   # primitives, DataTable
└── lib/                      # utils, mock data (swap for Firestore Admin SDK)
```

Data currently comes from `lib/mock-data.ts`. To go live, replace those exports
with Firestore Admin SDK queries — the component layer stays unchanged.

Light **and** dark mode are supported (toggle in the top bar).
