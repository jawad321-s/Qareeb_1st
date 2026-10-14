// Same rules as the mobile app (mobile/src/lib/phone.ts): the phone number is
// the account identity, compared in one canonical form.

/** "+" and digits only, with a local 05… number turned into +970 5…. */
export function normalizePhone(input: string): string {
  let d = (input ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (/^05\d{8}$/.test(d)) d = '970' + d.slice(1);
  else if (/^5\d{8}$/.test(d)) d = '970' + d;
  return d ? '+' + d : '';
}

/** A Palestinian mobile number (+970 or +972, then 5 and eight more digits). */
export const isValidPhone = (input: string) => /^\+97[02]5\d{8}$/.test(normalizePhone(input));

/**
 * The internal sign-in id Firebase Auth keeps for an account (its password
 * sign-in needs an email-shaped id). Never shown to anyone. Must match
 * mobile/src/lib/phone.ts and firebase/seed.
 */
export function authIdFor(phone: string, role: 'customer' | 'artisan' | 'admin'): string {
  return `${normalizePhone(phone).slice(1)}.${role}@qareeb.app`;
}

/** "+970 59 000 0001" */
export function formatPhone(phone: string): string {
  const m = normalizePhone(phone).match(/^\+(\d{3})(\d{2})(\d{3})(\d{4})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
