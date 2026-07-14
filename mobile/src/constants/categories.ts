import type { Category } from '@/types';

// The 12 core service categories offered on Qareeb. `icon` maps to a key in the
// Icon component; `colorHex` drives the gradient/tint of the category tile.
export const CATEGORIES: Category[] = [
  { id: 'plumbing', slug: 'plumbing', name: { ar: 'سباكة', en: 'Plumbing' }, icon: 'droplet', colorHex: '#3B82F6', order: 1, active: true },
  { id: 'electrical', slug: 'electrical', name: { ar: 'كهرباء', en: 'Electrical' }, icon: 'zap', colorHex: '#F59E0B', order: 2, active: true },
  { id: 'carpentry', slug: 'carpentry', name: { ar: 'نجارة', en: 'Carpentry' }, icon: 'hammer', colorHex: '#B45309', order: 3, active: true },
  { id: 'ac', slug: 'air-conditioning', name: { ar: 'تكييف', en: 'Air Conditioning' }, icon: 'wind', colorHex: '#06B6D4', order: 4, active: true },
  { id: 'painting', slug: 'painting', name: { ar: 'دهان', en: 'Painting' }, icon: 'paintbrush', colorHex: '#EC4899', order: 5, active: true },
  { id: 'cleaning', slug: 'cleaning', name: { ar: 'تنظيف', en: 'Cleaning' }, icon: 'sparkles', colorHex: '#10B981', order: 6, active: true },
  { id: 'maintenance', slug: 'maintenance', name: { ar: 'صيانة', en: 'Maintenance' }, icon: 'wrench', colorHex: '#6366F1', order: 7, active: true },
  { id: 'repair', slug: 'home-repair', name: { ar: 'إصلاح منزلي', en: 'Home Repair' }, icon: 'tools', colorHex: '#8B5CF6', order: 8, active: true },
  { id: 'appliance', slug: 'appliance-repair', name: { ar: 'إصلاح أجهزة', en: 'Appliance Repair' }, icon: 'plug', colorHex: '#0EA5E9', order: 9, active: true },
  { id: 'gardening', slug: 'gardening', name: { ar: 'بستنة', en: 'Gardening' }, icon: 'leaf', colorHex: '#22C55E', order: 10, active: true },
  { id: 'satellite', slug: 'satellite', name: { ar: 'ستلايت', en: 'Satellite' }, icon: 'satellite', colorHex: '#64748B', order: 11, active: true },
  { id: 'moving', slug: 'moving', name: { ar: 'نقل عفش', en: 'Moving' }, icon: 'truck', colorHex: '#EF4444', order: 12, active: true },
];

export const categoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id);
