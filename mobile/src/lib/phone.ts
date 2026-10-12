// The phone number is the account's identity: one account per number. Every
// comparison goes through `normalizePhone`, so "0599 123 456", "+970599123456"
// and "00970599123456" are the same account.

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

/** "+970 59 000 0001", isolated left-to-right so it reads correctly inside Arabic text. */
export function displayPhone(phone: string): string {
  const m = normalizePhone(phone).match(/^\+(\d{3})(\d{2})(\d{3})(\d{4})$/);
  return `⁦${m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone}⁩`;
}
