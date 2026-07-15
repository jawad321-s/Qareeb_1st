# Mobile ↔ Admin Integration (Firebase / Firestore)

The mobile apps and the admin dashboard share one **Firestore** backend. Each
side runs on **local mock data by default** and automatically switches to the
shared live backend the moment a Firebase project is configured — no code
changes required.

## How the switch works

| Condition | Mode |
|-----------|------|
| No `FIREBASE_PROJECT_ID` / `API_KEY` set | **Mock** (local, offline) |
| Firebase config present | **Live** (shared Firestore) |
| `USE_MOCK=true` set explicitly | **Mock** (forced) |

- Mobile: `mobile/src/lib/config.ts` → `config.useMock`
- Admin: `admin/lib/config.ts` → `config.useMock`

## Setup (going live)

1. Create a free Firebase project → add a **Web app**.
2. Enable **Firestore** and **Storage**.
3. Copy the SDK config into env files:
   - `mobile/.env` (see `mobile/.env.example`) — `EXPO_PUBLIC_FIREBASE_*`
   - `admin/.env.local` (see `admin/.env.example`) — `NEXT_PUBLIC_FIREBASE_*`
   - **Use the same project for both.**
4. Deploy rules/indexes and seed:
   ```bash
   cd firebase
   npm install
   firebase deploy --only firestore:rules,firestore:indexes,storage
   npm run seed        # optional demo data
   ```
5. Restart both apps. They now read/write the same data.

## First integrated flow — Artisan verification

The vertical slice wired end-to-end:

```
Mobile (artisan)                Firestore                    Admin
────────────────                ─────────                    ─────
Verification screen  ──submit──▶ verificationRequests/{uid}  ──live──▶ Verification queue
  • uploads ID + certs           status: "pending"                     (real-time cards)
    to Storage                                                          approve / reject
                                                                              │
Verified badge  ◀──live snapshot── status: "approved"/"rejected" ◀──write────┘
  (auto-updates)                   users/{uid}.verified = true
```

- **Mobile write:** `mobile/src/services/verification.service.ts` →
  `submitVerification()` uploads documents to Storage and writes the request.
- **Admin read/decide:** `admin/lib/verification.service.ts` →
  `subscribeVerifications()` (live) + `decideVerification()` (persists the
  decision and flips the artisan's `verified` flag).
- **Mobile read-back:** `watchVerificationStatus()` (`onSnapshot`) updates the
  status banner the instant the admin decides.

### The shared contract — `verificationRequests/{artisanId}`

```ts
{
  id, artisanId, name, email, phone,
  categoryIds: string[], category: string,
  status: 'pending' | 'approved' | 'rejected',
  idFrontUrl, idBackUrl, selfieUrl,
  certificateUrls: string[],
  submittedAt: Timestamp, reviewedAt: Timestamp | null,
}
```

## Extending to other collections

The same pattern (a `*.service.ts` with a mock branch + a Firestore branch,
gated by `config.useMock`) extends to `users`, `requests`, `offers`,
`reviews`, `wallets`, `complaints`, etc. — all already defined in
`firebase/firestore.rules` and `docs/DATABASE_SCHEMA.md`.
