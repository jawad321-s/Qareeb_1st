'use client';

import { useEffect } from 'react';
import { useCollection } from '@/lib/live-data';
import { registerCategoryNames } from '@/lib/catalog';

/** Mounted once in the dashboard: category names follow the admin's changes everywhere. */
export function CatalogSync() {
  const categories = useCollection('categories');
  useEffect(() => {
    if (categories) registerCategoryNames(categories);
  }, [categories]);
  return null;
}
