// Live dashboard data from the shared Firestore. Every page that showed demo
// numbers reads from here when a Firebase project is configured; on mock mode
// the pages keep their demo data (lib/mock-data.ts).
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getDb, isLive } from './firebase';
import type { AdminUser, Complaint } from './mock-data';

export type LiveDoc = Record<string, any> & { id: string };

/** Firestore Timestamp | epoch millis | undefined → epoch millis (0 if absent). */
export const toMillis = (v: any): number =>
  v && typeof v.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : 0;

/** Live snapshot of a whole collection (null while loading, [] on error). */
export function useCollection(name: string): LiveDoc[] | null {
  const [docs, setDocs] = useState<LiveDoc[] | null>(null);
  useEffect(() => {
    const db = getDb();
    if (!db || !isLive()) return;
    return onSnapshot(
      collection(db, name),
      (snap) => setDocs(snap.docs.map((d) => ({ ...d.data(), id: d.id }))),
      () => setDocs([]),
    );
  }, [name]);
  return docs;
}

// ── Categories (same ids/names as the app catalog) ──────────────────────────
export const CATEGORY_NAMES: Record<string, { en: string; ar: string }> = {
  plumbing: { en: 'Plumbing', ar: 'سباكة' },
  electrical: { en: 'Electrical', ar: 'كهرباء' },
  carpentry: { en: 'Carpentry', ar: 'نجارة' },
  ac: { en: 'Air Conditioning', ar: 'تكييف' },
  painting: { en: 'Painting', ar: 'دهان' },
  cleaning: { en: 'Cleaning', ar: 'تنظيف' },
  repair: { en: 'Home Repair', ar: 'إصلاح منزلي' },
  appliance: { en: 'Appliance Repair', ar: 'إصلاح أجهزة' },
  gardening: { en: 'Gardening', ar: 'بستنة' },
  satellite: { en: 'Satellite', ar: 'ستلايت' },
  moving: { en: 'Moving', ar: 'نقل عفش' },
};
export const categoryName = (id: string, locale: 'en' | 'ar') => CATEGORY_NAMES[id]?.[locale] ?? id;

// ── Derived figures ─────────────────────────────────────────────────────────
const monthKey = (ms: number) => {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
};

/** % change of `current` over `previous` (one decimal; 100 when growing from 0). */
export function delta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Items created this calendar month vs last month. */
export function monthOverMonth(items: LiveDoc[], field = 'createdAt', value: (d: LiveDoc) => number = () => 1) {
  const now = monthKey(Date.now());
  let current = 0;
  let previous = 0;
  for (const d of items) {
    const k = monthKey(toMillis(d[field]));
    if (k === now) current += value(d);
    else if (k === now - 1) previous += value(d);
  }
  return delta(current, previous);
}

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** The last 12 months: revenue (subscription payments) and requests created. */
export function monthlySeries(subscriptions: LiveDoc[], requests: LiveDoc[], locale: 'en' | 'ar') {
  const now = monthKey(Date.now());
  const rows = Array.from({ length: 12 }, (_, i) => {
    const k = now - 11 + i;
    return { key: k, month: MONTHS[locale][((k % 12) + 12) % 12], revenue: 0, requests: 0 };
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const s of subscriptions) {
    const row = byKey.get(monthKey(toMillis(s.activatedAt)));
    if (row) row.revenue += Number(s.amount) || 0;
  }
  for (const r of requests) {
    const row = byKey.get(monthKey(toMillis(r.createdAt)));
    if (row) row.requests += 1;
  }
  return rows.map(({ month, revenue, requests: n }) => ({ month, revenue: Math.round(revenue / 100), requests: n }));
}

/** Requests per category, biggest first. */
export function categorySplit(requests: LiveDoc[], locale: 'en' | 'ar') {
  const counts = new Map<string, number>();
  for (const r of requests) if (r.categoryId) counts.set(r.categoryId, (counts.get(r.categoryId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, value]) => ({ name: categoryName(id, locale), value }));
}

/** Requests grouped into pending / active / completed / cancelled. */
export function requestsByStatus(requests: LiveDoc[]) {
  const n = (pred: (s: string) => boolean) => requests.filter((r) => pred(r.status)).length;
  return [
    { status: 'Pending', value: n((s) => s === 'PENDING'), color: '#F59E0B' },
    { status: 'Active', value: n((s) => ['ACCEPTED', 'ON_THE_WAY', 'WORKING'].includes(s)), color: '#3B82F6' },
    { status: 'Completed', value: n((s) => s === 'COMPLETED'), color: '#10B981' },
    { status: 'Cancelled', value: n((s) => s === 'CANCELLED'), color: '#EF4444' },
  ];
}

export interface ActivityItem {
  id: string;
  type: 'verify' | 'complaint' | 'subscription' | 'request' | 'user';
  text: { en: string; ar: string };
  time: number;
}

/** The most recent events across collections, newest first. */
export function recentActivity(
  data: { users: LiveDoc[]; requests: LiveDoc[]; verifications: LiveDoc[]; complaints: LiveDoc[]; subscriptions: LiveDoc[] },
  max = 6,
): ActivityItem[] {
  const nameOf = new Map(data.users.map((u) => [u.id, u.fullName ?? '']));
  const items: ActivityItem[] = [
    ...data.users.map((u) => ({
      id: `u_${u.id}`,
      type: 'user' as const,
      text: u.role === 'artisan'
        ? { en: `New artisan joined: ${u.fullName ?? ''}`, ar: `انضم حرفي جديد: ${u.fullName ?? ''}` }
        : { en: `New customer joined: ${u.fullName ?? ''}`, ar: `انضم زبون جديد: ${u.fullName ?? ''}` },
      time: toMillis(u.createdAt),
    })),
    ...data.requests.map((r) => ({
      id: `r_${r.id}`,
      type: 'request' as const,
      text: { en: `New request: ${r.title ?? ''}`, ar: `طلب جديد: ${r.title ?? ''}` },
      time: toMillis(r.createdAt),
    })),
    ...data.verifications.map((v) => ({
      id: `v_${v.id}`,
      type: 'verify' as const,
      text: { en: `Verification request from ${v.name ?? ''}`, ar: `طلب توثيق من ${v.name ?? ''}` },
      time: toMillis(v.submittedAt),
    })),
    ...data.complaints.map((c) => ({
      id: `c_${c.id}`,
      type: 'complaint' as const,
      text: { en: `New report: ${c.reason ?? ''}`, ar: `بلاغ جديد: ${c.reason ?? ''}` },
      time: toMillis(c.createdAt),
    })),
    ...data.subscriptions.map((s) => ({
      id: `s_${s.id}`,
      type: 'subscription' as const,
      text: { en: `${nameOf.get(s.artisanId) || 'An artisan'} subscribed (${s.planId})`, ar: `اشترك ${nameOf.get(s.artisanId) || 'حرفي'} (${s.planId})` },
      time: toMillis(s.activatedAt),
    })),
  ];
  return items.filter((i) => i.time > 0).sort((a, b) => b.time - a.time).slice(0, max);
}

/** users/{uid} docs → rows for the users table. */
export function toAdminUsers(users: LiveDoc[], requests: LiveDoc[]): AdminUser[] {
  const jobs = new Map<string, number>();
  for (const r of requests) {
    if (r.status !== 'COMPLETED') continue;
    for (const uid of [r.customerId, r.acceptedArtisanId]) if (uid) jobs.set(uid, (jobs.get(uid) ?? 0) + 1);
  }
  return users
    .filter((u) => u.role === 'customer' || u.role === 'artisan')
    .map((u) => ({
      uid: u.id,
      fullName: u.fullName ?? '—',
      phone: u.phone ?? '',
      role: u.role,
      status: u.status ?? 'active',
      verified: u.verified === true,
      rating: Number(u.rating) || 0,
      jobs: jobs.get(u.id) ?? 0,
      city: u.location?.address ?? '—',
      joinedAt: toMillis(u.createdAt),
    }))
    .sort((a, b) => b.joinedAt - a.joinedAt);
}

/** complaints docs → rows for the complaints list. */
export function toComplaints(complaints: LiveDoc[]): (Complaint & { details?: string })[] {
  return complaints
    .map((c) => ({
      id: c.id,
      reporter: c.reporterName ?? '—',
      target: c.targetName ?? '',
      reason: c.reason ?? '—',
      details: c.details ?? '',
      status: (c.status ?? 'open') as Complaint['status'],
      createdAt: toMillis(c.createdAt),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}
