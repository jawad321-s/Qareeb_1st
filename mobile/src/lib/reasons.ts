// Why a request was cancelled or an offer turned down. The codes are stored on
// the request (cancelChoice) or the offer (rejectChoice) and turned into words
// for the other party; keep them in sync with firebase/functions/src/messages.js.
import type { TranslationKey } from '@/i18n/translations';

export type ReasonContext = 'customerCancel' | 'artisanCancel' | 'rejectOffer';

export const REASONS: Record<ReasonContext, string[]> = {
  customerCancel: ['changed_mind', 'found_other', 'too_long', 'price', 'other'],
  artisanCancel: ['not_available', 'too_far', 'customer_unreachable', 'job_mismatch', 'other'],
  rejectOffer: ['price_high', 'eta_long', 'other'],
};

export interface Reason {
  choice: string;
  /** Optional words of the user's own (required for "other"). */
  note?: string;
}

export const reasonKey = (code: string) => `reason.${code}` as TranslationKey;

/** "Reason — their note", or '' when none was given. */
export function reasonText(t: (k: TranslationKey) => string, choice?: string, note?: string): string {
  const label = choice ? t(reasonKey(choice)) : '';
  return [label, note?.trim()].filter(Boolean).join(' — ');
}
