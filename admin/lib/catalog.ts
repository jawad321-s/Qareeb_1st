// The service catalog as the dashboard edits it. The apps ship the built-in
// services (icons, colours, order); categories/{id} in Firestore holds the
// admin's renames and hidden flags for those, and the services the admin adds
// (custom: true, with their own name, icon and colour). The app follows both
// live (mobile/src/store/catalog.ts uses the same icon keys).
'use client';

import {
  Briefcase, Camera, Car, Droplet, Drill, Hammer, House, Key, Leaf, Lightbulb, Lock, Monitor, Package,
  Paintbrush, Plug, SatelliteDish, Scissors, Shield, Sparkles, Sun, Truck, Wind, Wrench, Zap, type LucideIcon,
} from 'lucide-react';
import { CATEGORY_NAMES, type LiveDoc } from './live-data';

/** App icon key → the same picture in the dashboard. */
export const ICONS: Record<string, LucideIcon> = {
  droplet: Droplet, zap: Zap, hammer: Hammer, wind: Wind, paintbrush: Paintbrush, sparkles: Sparkles,
  wrench: Wrench, tools: Drill, plug: Plug, leaf: Leaf, satellite: SatelliteDish, truck: Truck,
  home: House, camera: Camera, shield: Shield, sun: Sun, lightbulb: Lightbulb, lock: Lock, key: Key,
  monitor: Monitor, scissors: Scissors, car: Car, package: Package, briefcase: Briefcase,
};
export const ICON_KEYS = Object.keys(ICONS);

export const PALETTE = [
  '#2563EB', '#0EA5E9', '#06B6D4', '#14B8A6', '#0D9488', '#16A34A', '#CA8A04', '#EA580C',
  '#DC2626', '#DB2777', '#8B5CF6', '#6366F1', '#4338CA', '#475569',
];

/** The services every app version ships with. */
export const BUILT_IN = [
  { id: 'plumbing', color: '#2563EB', icon: 'droplet', order: 1 },
  { id: 'electrical', color: '#0EA5E9', icon: 'zap', order: 2 },
  { id: 'carpentry', color: '#6366F1', icon: 'hammer', order: 3 },
  { id: 'ac', color: '#06B6D4', icon: 'wind', order: 4 },
  { id: 'painting', color: '#8B5CF6', icon: 'paintbrush', order: 5 },
  { id: 'cleaning', color: '#14B8A6', icon: 'sparkles', order: 6 },
  { id: 'repair', color: '#7C3AED', icon: 'tools', order: 7 },
  { id: 'appliance', color: '#0284C7', icon: 'plug', order: 8 },
  { id: 'gardening', color: '#0D9488', icon: 'leaf', order: 9 },
  { id: 'satellite', color: '#475569', icon: 'satellite', order: 10 },
  { id: 'moving', color: '#4338CA', icon: 'truck', order: 11 },
];

/** A fresh id for an added service (ASCII, so it is safe in links and queries). */
export const newCategoryId = () => `svc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Compare names the way people type them (no diacritics, one alef, ة→ه, ى→ي). */
export const sameName = (a: string, b: string) => {
  const n = (s: string) =>
    s.trim().toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ');
  return n(a) === n(b);
};

/**
 * Keeps the names the dashboard shows for categories (requests, analytics,
 * verifications) in step with Firestore: renamed built-ins and added services.
 */
export function registerCategoryNames(docs: LiveDoc[]) {
  for (const d of docs) {
    const ar = d.name?.ar?.trim();
    if (!ar) continue;
    CATEGORY_NAMES[d.id] = { ar, en: d.name?.en?.trim() || ar };
  }
}
