# Firestore Database Schema — Qareeb

All timestamps are Firestore `Timestamp`. All money is stored as **integer minor
units** (e.g. cents/halalas) to avoid floating-point drift. Geo fields store both
a `GeoPoint` and a precomputed `geohash` string for range queries.

---

## Collection Map

```
users/{uid}
  ├── notifications/{notifId}
  └── fcmTokens/{tokenId}

publicProfiles/{uid}           # what others see of any account (no contact details)
artisanProfiles/{uid}          # 1:1 with a user whose role = "artisan"

categories/{categoryId}
services/{serviceId}

requests/{requestId}
  └── messages/{messageId}     # chat thread for the accepted job

offers/{offerId}

reviews/{reviewId}

  └── transactions/{txnId}

subscriptions/{subscriptionId}
complaints/{complaintId}
verificationRequests/{verificationId}
auditLogs/{logId}
cms/{docId}
```

---

## `users/{uid}`

| Field | Type | Notes |
|---|---|---|
| `uid` | string | == doc id |
| `role` | `'customer' \| 'artisan' \| 'admin'` | drives app experience |
| `fullName` | string | |
| `phone` | string | E.164 (`+970…`) — the account identity with `role`: one customer and one artisan account per number, no email |
| `photoUrl` | string? | Storage URL |
| `location` | `{ geopoint: GeoPoint, geohash: string, address: string }` | last known |
| `locale` | `'ar' \| 'en'` | default `ar` |
| `status` | `'active' \| 'suspended' \| 'pending'` | |
| `verified` | boolean | mirrors auth custom claim |
| `rating` | number | denormalized average (0–5) |
| `ratingCount` | number | |
| `createdAt` / `updatedAt` | Timestamp | |

A customer's `users` doc (phone, home location) is readable only by them and
the admins; artisans' docs are public. Everyone else sees a customer through
`publicProfiles/{uid}`.

## `publicProfiles/{uid}`

`{ uid, role, fullName, photoUrl?, rating, ratingCount, createdAt, updatedAt }`:
the fields other users may see. Written only by the account's own app (the
rules allow no other fields), refreshed whenever the user opens the app or their
name, photo or rating changes.

### Subcollection `users/{uid}/notifications/{id}`
`{ id, type, title, body, data, read: boolean, createdAt }`

### Subcollection `users/{uid}/fcmTokens/{id}`
`{ token, platform, createdAt }`

---

## `artisanProfiles/{uid}`

| Field | Type | Notes |
|---|---|---|
| `uid` | string | == user id |
| `bio` | string | |
| `serviceIds` | string[] | references `services` |
| `categoryIds` | string[] | references `categories` |
| `basePrices` | `Record<serviceId, number>` | minor units |
| `availability` | `{ days: number[], from: string, to: string }` | weekly schedule |
| `available` | boolean? | the dashboard switch; `false` stops new requests (app and Cloud Functions). Missing = available |
| `gallery` | string[] | Storage URLs of past work |
| `certificates` | `{ name, url, verified }[]` | |
| `idDocuments` | `{ frontUrl, backUrl, verified }` | KYC |
| `verificationStatus` | `'unsubmitted' \| 'pending' \| 'approved' \| 'rejected'` | |
| `premium` | boolean | subscription badge |
| `completedJobs` | number | denormalized; the artisan's app refreshes it from their job history |
| `rating` / `ratingCount` | number | |

---

## `categories/{categoryId}`
`{ id, slug, name: {ar,en}, icon, colorHex, order, active }`

The apps ship the catalog (icons, colours, order); only `name` and `active`
here are applied on top of it. The admin dashboard → Categories renames a
category or hides it (`active: false`): hidden ones are no longer offered for
new requests or services.

## `settings/platform`
`{ supportPhone?, supportWhatsApp?, supportEmail?, updatedAt }`: set in the
admin dashboard → Settings, shown on the app's Help screen. Readable by anyone,
written only by admins.

## `services/{serviceId}`
`{ id, categoryId, name: {ar,en}, description: {ar,en}, icon, basePriceFrom, active, popular }`

---

## `requests/{requestId}`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `customerId` | string | → users |
| `serviceId` | string | → services |
| `categoryId` | string | denormalized for filtering |
| `title` | string | |
| `description` | string | |
| `images` | string[] | Storage URLs |
| `location` | `{ geopoint, geohash, address }` | |
| `preferredTime` | Timestamp | |
| `budget` | `{ min, max }` | minor units |
| `status` | `RequestStatus` | see enum below |
| `acceptedOfferId` | string? | |
| `acceptedArtisanId` | string? | |
| `offerCount` | number | denormalized |
| `createdAt` / `updatedAt` | Timestamp | |

**`RequestStatus` enum:**
`PENDING → ACCEPTED → ON_THE_WAY → WORKING → COMPLETED` (plus `CANCELLED`).

### Subcollection `requests/{id}/messages/{messageId}`
`{ id, senderId, type: 'text'|'image'|'voice', text?, mediaUrl?, durationMs?, read, createdAt }`

---

## `offers/{offerId}`

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `requestId` | string | → requests |
| `artisanId` | string | → users |
| `customerId` | string | denormalized for rules |
| `price` | number | minor units |
| `etaMinutes` | number | estimated arrival |
| `message` | string | pitch to customer |
| `status` | `'PENDING' \| 'ACCEPTED' \| 'REJECTED' \| 'WITHDRAWN'` | |
| `createdAt` | Timestamp | |

---

## `reviews/{reviewId}`
`{ id, requestId, authorId, targetId, role: 'customer'|'artisan', rating: 1..5, comment, createdAt }`

## `subscriptions/{id}`
`{ id, artisanId, plan: 'free'|'pro'|'elite', price, status, startedAt, renewsAt }`

## `complaints/{id}`
`{ id, reporterId, targetId, requestId?, reason, description, status: 'open'|'reviewing'|'resolved', createdAt }`

## `verificationRequests/{id}`
`{ id, artisanId, documents, status, reviewerId?, note?, createdAt, reviewedAt? }`

## `auditLogs/{id}`
`{ id, actorId, action, entity, entityId, before?, after?, createdAt }`

---

## Relationships (ER summary)

```
users 1───1 artisanProfiles          (role = artisan)
users 1───* requests                  (as customer)
users 1───* offers                    (as artisan)
requests 1───* offers
requests 1───1 offers                 (acceptedOfferId)
requests 1───* messages
requests 1───* reviews
categories 1───* services
services 1───* requests
```

---

## Composite Indexes

Defined in [`firebase/firestore.indexes.json`](../firebase/firestore.indexes.json):

| Collection | Fields | Used by |
|---|---|---|
| `requests` | `status ASC, geohash ASC` | artisan nearby feed |
| `requests` | `customerId ASC, createdAt DESC` | customer request history |
| `requests` | `categoryId ASC, status ASC, createdAt DESC` | admin filtering |
| `offers` | `requestId ASC, createdAt DESC` | offer comparison |
| `offers` | `artisanId ASC, status ASC, createdAt DESC` | artisan offer list |
| `reviews` | `targetId ASC, createdAt DESC` | profile reviews |
| `complaints` | `status ASC, createdAt DESC` | admin queue |
| `verificationRequests` | `status ASC, createdAt ASC` | verification queue |

---

## Denormalization Strategy

To keep reads cheap (Firestore bills per document read), we denormalize:
- `rating` / `ratingCount` onto `users` & `artisanProfiles` (updated by a
  Cloud Function on new review).
- `offerCount` onto `requests` (incremented on offer create).
- `customerId` onto `offers` (so security rules can authorize without a join).
- `categoryId` onto `requests` (so category filters don't need a service lookup).
