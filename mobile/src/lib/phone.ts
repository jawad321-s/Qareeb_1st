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

/** A Palestinian mobile number: Jawwal (059) or Ooredoo (056), as +970 or +972. */
export const isValidPhone = (input: string) => /^\+97[02]5[69]\d{7}$/.test(normalizePhone(input));

/**
 * The number without its country code ("599123456"). +970 and +972 forms of a
 * Palestinian mobile are the same line, so they share one key — used for the
 * Firebase sign-in identity (see services/auth.service.ts).
 */
export const nationalNumber = (input: string) => normalizePhone(input).replace(/^\+97[02]/, '');

/** "+970 59 000 0001", isolated left-to-right so it reads correctly inside Arabic text. */
export function displayPhone(phone: string): string {
  const m = normalizePhone(phone).match(/^\+(\d{3})(\d{2})(\d{3})(\d{4})$/);
  return `⁦${m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone}⁩`;
}
