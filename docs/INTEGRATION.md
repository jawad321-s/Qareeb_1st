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

## Authentication — phone + password

Customers and artisans sign in with **phone number + password**
(`mobile/src/services/auth.service.ts`). Each phone number maps to an internal
login on Firebase's **Email/Password** provider, scoped per role
(`customer-599123456@phone.qareeb.app`, `artisan-599123456@phone.qareeb.app`),
so no SMS is needed and it works in Expo Go. One phone number can therefore
hold **both** a customer and an artisan account (separate profiles and
passwords). Only Palestinian mobiles (059 / 056) are accepted; `0599123456`,
`+970599123456` and `+972599123456` all resolve to the same login. The real email is kept on
`users/{uid}.email`.

- **Sign-up** creates the Auth account, `users/{uid}` (role `customer` or
  `artisan`) and, for artisans, `artisanProfiles/{uid}`.
- **Roles:** customer/artisan come from `users/{uid}.role` (locked after
  sign-up by the rules). **Admins** use the `role: "admin"` custom claim:
  ```bash
  cd firebase && npm run set-role -- admin@example.com admin
  ```
  The admin must sign out and back in afterwards. The admin dashboard
  (`admin/lib/session.ts`) signs in with Firebase email/password and rejects
  any account without this claim.
- **Not yet:** password reset by SMS (planned with Phone Auth). Until then an
  admin sets a new password with the Admin SDK
  (`admin.auth().updateUser(uid, { password })`) — the console's "reset
  password" email cannot reach the internal login address.

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

## Second integrated flow — Requests & Offers

The customer's request lifecycle is now shared end-to-end:

```
Mobile (customer)              Firestore              Mobile (artisan)        Admin
────────────────               ─────────              ────────────────        ─────
Create request  ──write──▶ requests/{id}  ──read──▶ Nearby requests feed
                            status:PENDING                    │
                                                       submit offer
Offers list  ◀──read──── offers (by requestId) ◀──write──────┘
Accept offer ──batch──▶ request:ACCEPTED + offers:ACCEPTED/REJECTED
                            │
                            └────────────────live──────────────────────▶ Requests table
                                                                          (real-time feed)
```

- **Mobile data facade:** `mobile/src/services/api.ts` picks `firebaseApi`
  (`firebase-api.ts`) when live — a full Firestore implementation with the
  **same surface** as the mock, so no screen/hook changed. It covers
  services, artisans, requests, offers, reviews and chat.
- **Admin read:** `admin/lib/requests.service.ts` → `subscribeRequests()`
  streams the `requests` collection into the admin table live.

## Extending to other collections

The same pattern (a `*.service.ts` with a mock branch + a Firestore branch,
gated by `config.useMock`, plus the `firebaseApi` facade on mobile) extends to
`reviews`, `complaints`, `subscriptions`, `notifications`, etc. —
all already defined in `firebase/firestore.rules` and
`docs/DATABASE_SCHEMA.md`.

## Request dispatch & notifications (Cloud Functions)

`firebase/functions` (Node 22, deployed to `europe-west1`) runs the
server-side logic. It needs the **Blaze** plan.

| Function | Trigger | What it does |
|---|---|---|
| `onRequestCreated` | `requests/{id}` created | Offers the request to artisans of its category (verified only when `REQUIRE_VERIFIED` is on) within **2 km** of the customer; stores `dispatch` + `notifiedArtisanIds` |
| `dispatchTick` | every minute | While a request has **no offers**: widens the radius by **2 km every 5 min** (max **12 km**), notifying only newly reached artisans. After **30 min** with no offers: `status: CANCELLED`, `cancelReason: NO_OFFERS` |
| `onOfferCreated` | `offers/{id}` created | Notifies the customer |
| `onRequestUpdated` | status change | Accepted → artisan; on the way / working / completed → customer (completed → both); cancelled → the other party, or the customer on timeout |
| `onMessageCreated` | chat message | Notifies the other party |

Tunables live in `firebase/functions/src/config.js`.

- Artisans only see (and can only quote on) requests dispatched to them
  (`notifiedArtisanIds`, enforced by the rules). Their location is refreshed
  on app open when permission is granted.
- Every notification is stored in `users/{uid}/notifications` (the bell
  screen, works in Expo Go) and pushed via the Expo push service to the tokens
  in `users/{uid}/fcmTokens`.
- Remote push needs an installed build (not Expo Go on Android):
  `eas init`, add `mobile/google-services.json` (Firebase Android app
  `com.qareeb.app`), upload the FCM V1 key with `eas credentials`, then
  `eas build -p android --profile preview`.

Tests: `cd firebase && firebase emulators:exec --only firestore "cd functions && npm test"`.
