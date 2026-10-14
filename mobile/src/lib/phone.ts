// The phone number is the account's identity: a number holds one customer and
// one separate artisan account. Every comparison goes through `normalizePhone`,
// so "0599 123 456", "+970599123456" and "00970599123456" are the same number.

/** Canonical form: "+" and digits only, with a local 05… number turned into +970 5…. */
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
 * The sign-in id Firebase Auth keeps for an account. Its password sign-in
 * needs an email-shaped id, so one is derived from the number and the account
 * type; it is internal only — never shown to or typed by anyone. The type is
 * part of it because a number holds a separate customer and artisan account.
 */
export function authIdFor(phone: string, role: 'customer' | 'artisan' | 'admin'): string {
  return `${normalizePhone(phone).slice(1)}.${role}@qareeb.app`;
}

/** "+970 59 000 0001", isolated left-to-right so it reads correctly inside Arabic text. */
export function displayPhone(phone: string): string {
  const m = normalizePhone(phone).match(/^\+(\d{3})(\d{2})(\d{3})(\d{4})$/);
  return `⁦${m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone}⁩`;
}
