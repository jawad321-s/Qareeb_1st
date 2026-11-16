// What users send the team from the app: complaints (about an artisan, a
// customer, or a general problem) and service suggestions. Reason codes match
// the app (mobile/src/services/complaints.service.ts).
'use client';

import { doc, updateDoc } from 'firebase/firestore';
import { getDb, isLive } from './firebase';
import type { Complaint, Suggestion } from './mock-data';
import type { Locale } from './i18n';

type Label = { ar: string; en: string };

const REASONS: Record<'artisan' | 'customer' | 'general', Record<string, Label>> = {
  artisan: {
    no_show: { ar: 'لم يحضر أو تأخّر كثيراً', en: "Didn't show up or was very late" },
    overcharged: { ar: 'طلب سعراً أعلى من المتفق عليه', en: 'Asked for more than agreed' },
    poor_quality: { ar: 'جودة عمل ضعيفة', en: 'Poor quality work' },
    unprofessional: { ar: 'سلوك غير محترم أو غير مهني', en: 'Rude or unprofessional' },
    safety: { ar: 'مخاوف تتعلق بالسلامة', en: 'Safety concern' },
    other: { ar: 'سبب آخر', en: 'Something else' },
  },
  customer: {
    no_show: { ar: 'لم يكن موجوداً أو لم يرد', en: "Wasn't there or didn't answer" },
    refused_pay: { ar: 'رفض الدفع أو ماطل فيه', en: 'Refused or delayed payment' },
    abusive: { ar: 'ألفاظ أو تصرفات مسيئة', en: 'Abusive language or behavior' },
    false_info: { ar: 'معلومات خاطئة عن العمل أو الموقع', en: 'Wrong job details or location' },
    safety: { ar: 'مخاوف تتعلق بالسلامة', en: 'Safety concern' },
    other: { ar: 'سبب آخر', en: 'Something else' },
  },
  general: {
    app_issue: { ar: 'خلل في التطبيق', en: "Something in the app isn't working" },
    account: { ar: 'مشكلة في الحساب', en: 'A problem with the account' },
    payment: { ar: 'مشكلة في الدفع أو الاشتراك', en: 'Payments or subscription' },
    other: { ar: 'سبب آخر', en: 'Something else' },
  },
};

/** Reports from app versions before reason codes stored the English label. */
const LEGACY_AR: Record<string, string> = {
  'Unprofessional behavior': 'سلوك غير محترف',
  'No-show / late': 'لم يحضر / تأخّر',
  Overcharged: 'مبالغة في السعر',
  'Poor quality work': 'جودة عمل ضعيفة',
  'Safety concern': 'مخاوف تتعلق بالسلامة',
  Other: 'أخرى',
};

export type ComplaintKind = 'artisan' | 'customer' | 'general';
export const complaintKind = (c: Pick<Complaint, 'targetRole'>): ComplaintKind => c.targetRole ?? 'general';

export function complaintReason(c: Pick<Complaint, 'reason' | 'targetRole'>, locale: Locale): string {
  const label = REASONS[complaintKind(c)][c.reason];
  if (label) return label[locale];
  return locale === 'ar' ? (LEGACY_AR[c.reason] ?? c.reason) : c.reason;
}

/**
 * The same service typed differently ("تنظيف خزانات المياه", "تنظيف الخزانات")
 * counts as one: no diacritics, one alef, ة→ه, ى→ي, and no "ال".
 */
export function suggestionKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.startsWith('ال') && w.length > 3 ? w.slice(2) : w))
    .join(' ');
}

/** Saves the team's decision. Demo mode only updates the page. */
export async function updateComplaint(id: string, patch: Pick<Complaint, 'status'> & { adminNote?: string }): Promise<void> {
  const db = getDb();
  if (!isLive() || !db) return;
  await updateDoc(doc(db, 'complaints', id), { ...patch, handledAt: Date.now() });
}

export async function updateSuggestion(id: string, status: Suggestion['status']): Promise<void> {
  const db = getDb();
  if (!isLive() || !db) return;
  await updateDoc(doc(db, 'suggestions', id), { status, handledAt: Date.now() });
}
