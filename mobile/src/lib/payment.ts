/**
 * Payment SIMULATOR for artisan subscriptions.
 *
 * Nothing here talks to a bank or a payment provider, and card details never
 * leave the device: the "processor" is a timer that approves or declines based
 * on the card number. Only the brand and last four digits are kept, for the
 * receipt. Swap `processPayment` for a real gateway (e.g. a Cloud Function that
 * calls the provider) when going live — the checkout screen won't change.
 */

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export type DeclineReason = 'declined' | 'insufficient_funds' | 'expired_card';

export type PaymentResult =
  | { ok: true; transactionId: string; brand: CardBrand; last4: string; paidAt: number }
  | { ok: false; reason: DeclineReason };

export interface CardInput {
  number: string;
  holder: string;
  expiry: string; // MM/YY
  cvv: string;
}

/**
 * Test cards shown on the checkout screen. Any other valid card number is
 * approved; these two exist so the failure paths can be demonstrated.
 */
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  insufficientFunds: '4000 0000 0000 9995',
} as const;

export const digitsOnly = (v: string) => v.replace(/\D/g, '');

/** "4242424242424242" → "4242 4242 4242 4242" (max 16 digits). */
export function formatCardNumber(v: string): string {
  return digitsOnly(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

/** "1228" → "12/28" as the user types. */
export function formatExpiry(v: string): string {
  const d = digitsOnly(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function cardBrand(number: string): CardBrand {
  const d = digitsOnly(number);
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
  return 'unknown';
}

/** Luhn checksum — the check real card forms run before contacting the bank. */
export function luhnValid(number: string): boolean {
  const d = digitsOnly(number);
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export function expiryValid(expiry: string, now = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // Valid through the last day of the expiry month.
  return new Date(year, month, 1) > now;
}

export type CardField = 'number' | 'holder' | 'expiry' | 'cvv';

/** Field-level problems, keyed by field; empty object means the card is valid. */
export function validateCard(card: CardInput): Partial<Record<CardField, true>> {
  const errors: Partial<Record<CardField, true>> = {};
  if (digitsOnly(card.number).length !== 16 || !luhnValid(card.number)) errors.number = true;
  if (card.holder.trim().length < 3) errors.holder = true;
  if (!expiryValid(card.expiry)) errors.expiry = true;
  if (!/^\d{3}$/.test(card.cvv)) errors.cvv = true;
  return errors;
}

/**
 * Simulated charge. Waits like a real authorization would, then approves
 * unless the number is one of the failing test cards.
 */
export async function processPayment(card: CardInput, _amountMinor: number): Promise<PaymentResult> {
  await new Promise((r) => setTimeout(r, 2200));
  const d = digitsOnly(card.number);
  if (d === digitsOnly(TEST_CARDS.declined)) return { ok: false, reason: 'declined' };
  if (d === digitsOnly(TEST_CARDS.insufficientFunds)) return { ok: false, reason: 'insufficient_funds' };
  if (!expiryValid(card.expiry)) return { ok: false, reason: 'expired_card' };
  return {
    ok: true,
    transactionId: `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    brand: cardBrand(d),
    last4: d.slice(-4),
    paidAt: Date.now(),
  };
}
