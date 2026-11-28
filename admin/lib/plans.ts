// Artisan subscription plans as the dashboard shows and prices them. Same ids,
// lengths and default prices as the app (mobile/src/lib/plans.ts); the prices
// the admin sets live in settings/plans and the app follows them at once.
// Plans and special offers the admin adds live in settings/plans.custom, by id,
// and the app shows them too (mobile/src/store/planPrices.ts reads the same
// fields and limits).
'use client';

import { useEffect, useState } from 'react';
import { deleteField, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { getDb, isLive } from './firebase';

export interface AdminPlan {
  id: 'trial' | 'quarter' | 'half' | 'year';
  name: string;
  nameAr: string;
  /** Default price for the whole period, in agorot (0 = free). */
  price: number;
  months: number;
  /** Demo figure (mock mode); live counts come from `subscriptions`. */
  subscribers: number;
  tone: 'neutral' | 'brand' | 'warning';
}

export const PLANS: AdminPlan[] = [
  { id: 'trial', name: '7-day free trial', nameAr: 'تجربة مجانية 7 أيام', price: 0, months: 0, subscribers: 214, tone: 'neutral' },
  { id: 'quarter', name: '3 months', nameAr: '3 أشهر', price: 12900, months: 3, subscribers: 168, tone: 'brand' },
  { id: 'half', name: '6 months', nameAr: '6 أشهر', price: 23900, months: 6, subscribers: 241, tone: 'brand' },
  { id: 'year', name: '1 year', nameAr: 'سنة', price: 44900, months: 12, subscribers: 97, tone: 'warning' },
];

export const MAX_PRICE_SHEKELS = 100_000;
/** Longest added plan or offer, in days (two years). */
export const MAX_DAYS = 730;
export const NAME_MAX = 60;
const BASE_IDS = PLANS.map((p) => p.id as string);

/** A plan or special offer the admin added (settings/plans.custom.{id}). */
export interface CustomPlanDoc {
  kind: 'plan' | 'offer';
  nameAr: string;
  nameEn: string;
  /** Price for the whole period, in agorot. */
  price: number;
  durationDays: number;
  /** Shown in the app; a hidden one can't be bought. */
  active: boolean;
  /** Offers only: can be bought until then (epoch ms). */
  endsAt?: number;
  createdAt?: number;
}
export type CustomPlan = CustomPlanDoc & { id: string };

/** Same checks as the app: anything malformed is left out. */
function parseCustomPlans(raw: unknown): CustomPlan[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: CustomPlan[] = [];
  for (const [id, v] of Object.entries(raw as Record<string, Record<string, unknown>>)) {
    if (!v || BASE_IDS.includes(id)) continue;
    const kind = v.kind === 'offer' ? 'offer' : v.kind === 'plan' ? 'plan' : null;
    const price = v.price as number;
    const days = v.durationDays as number;
    const nameAr = typeof v.nameAr === 'string' ? v.nameAr.trim() : '';
    if (!kind || !nameAr || !Number.isInteger(price) || price <= 0 || !Number.isInteger(days) || days < 1 || days > MAX_DAYS) continue;
    if (kind === 'offer' && typeof v.endsAt !== 'number') continue;
    out.push({
      id,
      kind,
      nameAr,
      nameEn: typeof v.nameEn === 'string' && v.nameEn.trim() ? v.nameEn.trim() : nameAr,
      price,
      durationDays: days,
      active: v.active !== false,
      endsAt: kind === 'offer' ? (v.endsAt as number) : undefined,
      createdAt: typeof v.createdAt === 'number' ? v.createdAt : undefined,
    });
  }
  return out.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

/** 'shown' | 'hidden' | 'ended' (an offer past its end date). */
export const customState = (p: CustomPlanDoc, now = Date.now()) =>
  !p.active ? 'hidden' : p.kind === 'offer' && (p.endsAt ?? 0) <= now ? 'ended' : 'shown';

/** An id for a new plan or offer. */
export const newPlanId = () => `c_${Date.now().toString(36)}`;

/** The name of any plan id — built-in, added, else the name kept on the subscription. */
export function planLabel(id: string, locale: 'en' | 'ar', custom: CustomPlan[], kept?: { ar?: string; en?: string }): string {
  const base = PLANS.find((p) => p.id === id);
  if (base) return locale === 'ar' ? base.nameAr : base.name;
  const c = custom.find((p) => p.id === id);
  if (c) return locale === 'ar' ? c.nameAr : c.nameEn;
  return kept?.[locale] || kept?.ar || id;
}

interface PlanSettings {
  prices: Record<string, number>;
  custom: CustomPlan[];
  loaded: boolean;
}

/** The admin's prices (plan id → agorot) and added plans, followed live; empty until set. */
export function usePlanPrices(): PlanSettings {
  const [state, setState] = useState<PlanSettings>({ prices: {}, custom: [], loaded: !isLive() });
  useEffect(() => {
    const db = getDb();
    if (!isLive() || !db) return;
    return onSnapshot(
      doc(db, 'settings', 'plans'),
      (snap) => {
        const data = snap.data() ?? {};
        setState({ prices: (data.prices as Record<string, number>) ?? {}, custom: parseCustomPlans(data.custom), loaded: true });
      },
      () => setState((s) => ({ ...s, loaded: true })),
    );
  }, []);
  return state;
}

/** Adds or replaces one plan or offer (the whole entry, so an old end date
 *  doesn't stay behind when an offer becomes a plan). Demo mode keeps nothing. */
export async function saveCustomPlan(id: string, data: CustomPlanDoc, by?: string): Promise<void> {
  const db = getDb();
  if (!isLive() || !db) return;
  const entry: Record<string, unknown> = {
    kind: data.kind,
    nameAr: data.nameAr.trim(),
    nameEn: data.nameEn.trim() || data.nameAr.trim(),
    price: data.price,
    durationDays: data.durationDays,
    active: data.active,
    createdAt: data.createdAt ?? Date.now(),
  };
  if (data.kind === 'offer' && data.endsAt) entry.endsAt = data.endsAt;
  await setDoc(
    doc(db, 'settings', 'plans'),
    { custom: { [id]: entry }, updatedAt: Date.now(), updatedBy: by ?? null },
    { mergeFields: [`custom.${id}`, 'updatedAt', 'updatedBy'] },
  );
}

/** Removes a plan or offer nobody has bought. */
export async function deleteCustomPlan(id: string, by?: string): Promise<void> {
  const db = getDb();
  if (!isLive() || !db) return;
  await updateDoc(doc(db, 'settings', 'plans'), { [`custom.${id}`]: deleteField(), updatedAt: Date.now(), updatedBy: by ?? null });
}

/** Saves new prices (agorot). Demo mode keeps nothing. */
export async function savePlanPrices(prices: Record<string, number>, by?: string): Promise<void> {
  const db = getDb();
  if (!isLive() || !db) return;
  await setDoc(doc(db, 'settings', 'plans'), { prices, updatedAt: Date.now(), updatedBy: by ?? null }, { merge: true });
}

/** Where one subscription stands now. */
export type SubState = 'active' | 'trial' | 'expired' | 'cancelled';
export function subState(s: Record<string, unknown>, now = Date.now()): SubState {
  if (s.status === 'cancelled') return 'cancelled';
  if (!(Number(s.expiresAt) > now)) return 'expired';
  return s.planId === 'trial' ? 'trial' : 'active';
}

/** Each artisan's subscriptions, newest first, by artisan id. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function subsByArtisan<T extends Record<string, any>>(subs: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const s of subs) {
    if (typeof s.artisanId !== 'string') continue;
    const list = m.get(s.artisanId) ?? [];
    list.push(s);
    m.set(s.artisanId, list);
  }
  for (const list of m.values()) list.sort((a, b) => Number(b.activatedAt ?? 0) - Number(a.activatedAt ?? 0));
  return m;
}
