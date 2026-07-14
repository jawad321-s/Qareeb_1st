<div align="center">

# 🛠️ Qareeb — قريب

### Nearby Home Services Platform

**Connecting customers with nearby verified artisans, in real time.**

[![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?logo=firebase)](https://firebase.google.com)

</div>

---

## 📖 Overview

**Qareeb** (Arabic: *قريب*, meaning "nearby") is a smart, GPS-powered marketplace that
connects customers who need home services with skilled artisans in their area.

The lifecycle of a request:

```
Customer creates request  →  Nearby artisans get notified  →  Artisans submit offers
        →  Customer compares & accepts an offer  →  In-app chat + live tracking
        →  Job completed  →  Both parties rate each other
```

### Supported service categories

Plumbing · Electrical · Carpentry · Air Conditioning · Painting · Cleaning ·
Maintenance · Home Repair · Appliance Repair · Gardening · Satellite Installation ·
Moving Services

---

## 🏗️ Monorepo Structure

| Package | Stack | Purpose |
|---|---|---|
| [`mobile/`](./mobile) | Expo SDK 54 · React Native · Expo Router · NativeWind | Customer **and** Artisan apps (role-based) |
| [`admin/`](./admin) | Next.js 15 · Tailwind · shadcn/ui · Recharts | Enterprise admin dashboard |
| [`firebase/`](./firebase) | Firestore · Storage · Auth · FCM | Backend: security rules, indexes, seed data |
| [`docs/`](./docs) | Markdown | Architecture, schema, design system, flows |

---

## 📚 Documentation

| Doc | Description |
|---|---|
| [Architecture](./docs/ARCHITECTURE.md) | System design, layers, data flow, module map |
| [Database Schema](./docs/DATABASE_SCHEMA.md) | Firestore collections, relationships, indexes |
| [Design System](./docs/DESIGN_SYSTEM.md) | Colors, typography, spacing, components, motion |
| [User Flows](./docs/USER_FLOWS.md) | Auth, request lifecycle, offers, chat, ratings |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20, npm ≥ 10
- A Firebase project (Auth + Firestore + Storage enabled)
- Expo Go app (for mobile) / Xcode / Android Studio

### Mobile app
```bash
cd mobile
npm install
cp .env.example .env        # fill in your Firebase + Maps keys
npx expo start
```

### Admin dashboard
```bash
cd admin
npm install
cp .env.example .env.local  # fill in your Firebase keys
npm run dev                  # http://localhost:3000
```

### Firebase backend
```bash
cd firebase
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes,storage
node seed/seed.mjs           # (optional) seed demo data
```

---

## 🎨 Design Philosophy

Qareeb's UI is engineered to feel like a premium consumer product — inspired by
**Apple**, **Airbnb**, **Uber**, **Stripe**, **Linear**, **Notion**, and **Material 3**.

- 🌗 First-class light **and** dark mode
- ✨ Glassmorphism, gradient accents, rounded cards
- 🎞️ Reanimated micro-interactions, skeleton & shimmer loading
- 🔤 Premium type scale and generous, professional spacing

See the [Design System](./docs/DESIGN_SYSTEM.md) for the full token set.

---

## 🧱 Tech Stack

**Mobile:** React Native · Expo SDK 54 · TypeScript · Expo Router · NativeWind ·
React Query · MMKV · Zod · React Hook Form · Reanimated · Expo Location

**Web:** Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion ·
TanStack Table · Recharts · React Query

**Backend:** Firebase Auth · Cloud Firestore · Firebase Storage · Cloud Messaging ·
Google Maps API

---

## 📄 License

Graduation project — © 2026 Qareeb. All rights reserved.
