# User Flows — Qareeb

## 1. Authentication

```
Welcome ─┬─► Register ─► OTP verify ─► [Location permission] ─► Customer Home
         │
         └─► Login ─► (role check) ─┬─► Customer Home
                                    └─► Artisan Dashboard
         Login ─► Forgot password ─► email link ─► Login
```

- Session persists in MMKV; the entry screen redirects by `role` on cold start.
- Demo shortcuts on Welcome enter instantly as Customer or Artisan.

## 2. Customer — request lifecycle

```
Home / Search ─► Service or Category
      │
      ▼
Create request (wizard)
  1. Pick service/category
  2. Title + description + photos
  3. Budget range + preferred time
  4. Review ─► Submit
      │
      ▼
Request detail  (status: PENDING)
  └─ Offers stream in ─► compare (sorted by price, "best value" flag)
        ├─ Reject offer
        └─ Accept offer  ─►  status: ACCEPTED
                              │
                              ▼
        Tracking timeline: ACCEPTED → ON_THE_WAY → WORKING → COMPLETED
        Chat + Call with the assigned artisan
                              │
                              ▼
                       COMPLETED ─► Leave review (stars + tags + comment)
```

## 3. Artisan — job lifecycle

```
Dashboard (online toggle, stats, nearby requests)
   │
   ▼
Nearby jobs ─► Job detail ─► Send quotation (price + ETA + message)
   │                                   │
   │                                   ▼
   │                            Offer: PENDING ─► (customer accepts)
   │                                   │
   ▼                                   ▼
My offers (PENDING/ACCEPTED/REJECTED)  Assigned job
                                       └─ Update status: ON_THE_WAY → WORKING → COMPLETED
                                       └─ Chat with customer
                                              │
                                              ▼
                                       COMPLETED ─► income updates, rate customer
```

## 4. Messaging

- Chat thread lives at `requests/{id}/messages` and is enabled once an offer is
  accepted (both parties authorized by security rules).
- Supports text, image and voice message types; polled/streamed in real time.

## 5. Admin moderation

```
Login ─► Overview (KPIs, charts, activity)
  ├─ Verifications ─► review docs ─► Approve / Reject (sets custom claim)
  ├─ Users ─► search / suspend
  ├─ Requests ─► monitor & filter
  ├─ Complaints ─► review ─► Resolve
  ├─ Categories ─► add / hide
  └─ Analytics ─► revenue, demand, category share
```

## 6. State transitions

**RequestStatus:** `PENDING → ACCEPTED → ON_THE_WAY → WORKING → COMPLETED`
(any state before COMPLETED → `CANCELLED`).

**OfferStatus:** `PENDING → ACCEPTED | REJECTED | WITHDRAWN`.
Accepting one offer auto-rejects the others on the same request.

**VerificationStatus:** `unsubmitted → pending → approved | rejected`.
