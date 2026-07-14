# System Architecture — Qareeb

## 1. High-Level Overview

Qareeb is a three-surface platform sharing a single Firebase backend:

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│   Customer App     │   │   Artisan App      │   │  Admin Dashboard   │
│  (React Native)    │   │  (React Native)    │   │    (Next.js 15)    │
│                    │   │                    │   │                    │
│  Same binary,      │   │  role = artisan    │   │  Web, RBAC-gated   │
│  role = customer   │   │                    │   │                    │
└─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │        Firebase Layer         │
                    │                               │
                    │  Auth · Firestore · Storage   │
                    │  Cloud Messaging · Functions  │
                    └──────────────┬────────────────┘
                                   │
                    ┌──────────────▼────────────────┐
                    │       External Services        │
                    │  Google Maps · Geocoding ·     │
                    │  Places · Directions           │
                    └────────────────────────────────┘
```

The **mobile app is a single codebase** that renders either the Customer or the
Artisan experience based on the authenticated user's `role`. This maximizes code
reuse (auth, chat, design system, networking) while keeping role-specific screens
isolated under `app/(customer)` and `app/(artisan)` route groups.

---

## 2. Client Architecture (Mobile)

Layered, unidirectional, and testable:

```
┌─────────────────────────────────────────────────────┐
│  Presentation   →  screens (Expo Router) + components │
├─────────────────────────────────────────────────────┤
│  State / Data   →  React Query (server state)         │
│                    Zustand (ephemeral UI state)       │
│                    MMKV (persisted cache/prefs)       │
├─────────────────────────────────────────────────────┤
│  Domain         →  services/ (use-cases), Zod schemas │
├─────────────────────────────────────────────────────┤
│  Infrastructure →  Firebase SDK adapters, Maps, FCM   │
└─────────────────────────────────────────────────────┘
```

**Rules of the road**
- Screens never call Firebase directly — they go through `src/services/*`.
- Every network boundary validates with **Zod** before data enters the app.
- Server state lives in **React Query**; never mirror it into Zustand.
- Persisted data (session, theme, onboarding flags) goes through the **MMKV** store.

### Folder structure (mobile)

```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root providers (Query, Theme, Auth)
│   ├── index.tsx                 # Splash / redirect
│   ├── (auth)/                   # Login, Register, OTP, Forgot password
│   ├── (customer)/               # Customer tab stack + nested screens
│   ├── (artisan)/                # Artisan tab stack + nested screens
│   └── (shared)/                 # Chat, notifications, settings
├── src/
│   ├── components/
│   │   ├── ui/                   # Design-system primitives (Button, Card…)
│   │   ├── feedback/             # Skeletons, shimmers, toasts, empty states
│   │   └── domain/               # ServiceCard, OfferCard, ArtisanCard…
│   ├── theme/                    # tokens, colors, typography, ThemeProvider
│   ├── services/                 # auth, requests, offers, chat, storage
│   ├── hooks/                    # useAuth, useLocation, useRequests…
│   ├── lib/                      # firebase, queryClient, mmkv, zod helpers
│   ├── store/                    # Zustand slices
│   ├── types/                    # Shared domain types
│   ├── constants/                # categories, config, routes
│   └── mock/                     # Mock API + fixtures (offline/dev mode)
└── assets/
```

---

## 3. Web Architecture (Admin)

Next.js 15 App Router with server components for data-heavy pages and client
components for interactive charts/tables.

```
admin/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + topbar shell
│   │   ├── page.tsx              # Overview / KPIs
│   │   ├── users/                # TanStack Table
│   │   ├── artisans/             # Verification queue
│   │   ├── requests/
│   │   ├── analytics/            # Recharts
│   │   ├── categories/
│   │   ├── complaints/
│   │   └── settings/
│   └── api/                      # Route handlers (server actions)
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── charts/                   # Recharts wrappers
│   └── tables/                   # TanStack Table cells & toolbars
└── lib/                          # firebase-admin, auth, utils
```

---

## 4. Data Flow — Request Lifecycle

```
Customer                Firestore                 Artisan
   │                       │                         │
   │  create request  ───► requests/{id}             │
   │                       │  status: PENDING        │
   │                       │──── fan-out (geo) ─────► │  (nearby, FCM push)
   │                       │                         │
   │                       │  ◄──── submit offer ─────│  offers/{id}
   │  ◄── offers stream ───│                         │
   │                       │                         │
   │  accept offer ──────► │  request.status:ACCEPTED │
   │                       │  offer.status:ACCEPTED   │──► notify artisan
   │                       │  other offers:REJECTED   │
   │                       │                         │
   │  ◄══════ chat (messages subcollection) ═══════► │
   │                       │                         │
   │                       │  status: ON_THE_WAY ◄────│  live location
   │                       │  status: WORKING    ◄────│
   │                       │  status: COMPLETED  ◄────│
   │  rate artisan ──────► reviews/{id} ◄──── rate customer
```

Geo fan-out uses **geohash** ranges (`src/services/geo.ts`) so a customer's
request is matched to artisans whose `serviceRadius` covers the request location.

---

## 5. State Management Strategy

| Concern | Tool | Persisted? |
|---|---|---|
| Remote/server data | React Query | via MMKV persister |
| Auth session | React Query + MMKV | ✅ |
| Theme (light/dark/system) | Zustand + MMKV | ✅ |
| Draft request form | React Hook Form | in-memory |
| Ephemeral UI (modals, toasts) | Zustand | ❌ |
| Onboarding / permissions | MMKV | ✅ |

---

## 6. Security Model

- **Authentication** — Firebase Auth (email/password + phone OTP). Custom claims
  (`role`, `verified`) set via Cloud Functions on approval.
- **Authorization** — Firestore Security Rules enforce per-collection access:
  customers read their own requests, artisans read requests in matched geohashes,
  admins (custom claim) read everything. See [`firebase/firestore.rules`](../firebase/firestore.rules).
- **Validation** — Zod on the client, Security Rules `is<Type>()` helpers on the server.
- **Storage** — signed, size-limited, content-type-restricted upload paths.

---

## 7. Offline & Resilience

- React Query cache is hydrated from MMKV on cold start → instant UI.
- Firestore offline persistence enabled → reads/writes queue when offline.
- A **Mock API** (`src/mock/`) lets the app run with zero backend for demos and CI.

---

## 8. Observability

- Structured logging wrapper (`src/lib/logger.ts`).
- Error boundary + Sentry-ready hook points.
- Admin **audit log** collection records every privileged mutation.
