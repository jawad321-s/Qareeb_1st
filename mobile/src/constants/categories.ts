import type { Category } from '@/types';

// The 11 core service categories offered on Qareeb. (A generic "Maintenance"
// category was dropped: it overlapped Home Repair and Appliance Repair, so
// customers couldn't tell which one to pick.) `icon` maps to a key in the
// Icon component; `colorHex` drives the gradient/tint of the category tile.
export const CATEGORIES: Category[] = [
  { id: 'plumbing', slug: 'plumbing', name: { ar: 'سباكة', en: 'Plumbing' }, icon: 'droplet', colorHex: '#2563EB', order: 1, active: true },
  { id: 'electrical', slug: 'electrical', name: { ar: 'كهرباء', en: 'Electrical' }, icon: 'zap', colorHex: '#0EA5E9', order: 2, active: true },
  { id: 'carpentry', slug: 'carpentry', name: { ar: 'نجارة', en: 'Carpentry' }, icon: 'hammer', colorHex: '#6366F1', order: 3, active: true },
  { id: 'ac', slug: 'air-conditioning', name: { ar: 'تكييف', en: 'Air Conditioning' }, icon: 'wind', colorHex: '#06B6D4', order: 4, active: true },
  { id: 'painting', slug: 'painting', name: { ar: 'دهان', en: 'Painting' }, icon: 'paintbrush', colorHex: '#8B5CF6', order: 5, active: true },
  { id: 'cleaning', slug: 'cleaning', name: { ar: 'تنظيف', en: 'Cleaning' }, icon: 'sparkles', colorHex: '#14B8A6', order: 6, active: true },
  { id: 'repair', slug: 'home-repair', name: { ar: 'إصلاح منزلي', en: 'Home Repair' }, icon: 'tools', colorHex: '#7C3AED', order: 7, active: true },
  { id: 'appliance', slug: 'appliance-repair', name: { ar: 'إصلاح أجهزة', en: 'Appliance Repair' }, icon: 'plug', colorHex: '#0284C7', order: 8, active: true },
  { id: 'gardening', slug: 'gardening', name: { ar: 'بستنة', en: 'Gardening' }, icon: 'leaf', colorHex: '#0D9488', order: 9, active: true },
  { id: 'satellite', slug: 'satellite', name: { ar: 'ستلايت', en: 'Satellite' }, icon: 'satellite', colorHex: '#475569', order: 10, active: true },
  { id: 'moving', slug: 'moving', name: { ar: 'نقل عفش', en: 'Moving' }, icon: 'truck', colorHex: '#4338CA', order: 11, active: true },
];

export const categoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id);
