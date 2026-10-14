// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — create (or update) an admin account that signs in with a phone
// number on the admin dashboard.
//
// Usage (inside firebase/):
//   npm run create-admin -- <phone> <password>
//   e.g. npm run create-admin -- 0599123456 'a-strong-password'
//
// The number maps to the internal sign-in address the dashboard uses
// (admin-<number>@phone.qareeb.app) and the account gets the `role: "admin"`
// custom claim the security rules check. Running it again for the same number
// resets the password. Credentials: seed/service-account.json or
// GOOGLE_APPLICATION_CREDENTIALS (same as the seed script).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const [phoneArg, password] = process.argv.slice(2);

// Same rules as admin/lib/phone.ts and mobile/src/lib/phone.ts.
function normalizePhone(input = '') {
  let d = String(input).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (/^05\d{8}$/.test(d)) d = '970' + d.slice(1);
  else if (/^5\d{8}$/.test(d)) d = '970' + d;
  return d ? '+' + d : '';
}
const phone = normalizePhone(phoneArg);

if (!/^\+97[02]5[69]\d{7}$/.test(phone) || !password || password.length < 6) {
  console.error('Usage: npm run create-admin -- <Palestinian mobile, e.g. 0599123456> <password, 6+ characters>');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, '..', 'seed', 'service-account.json');
if (existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
} else {
  admin.initializeApp();
}

const email = `admin-${phone.replace(/^\+97[02]/, '')}@phone.qareeb.app`;

try {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    user = await admin.auth().updateUser(user.uid, { password });
    console.log(`• Admin account for ${phone} already existed — password updated.`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    user = await admin.auth().createUser({ email, password, displayName: 'Qareeb Admin' });
    console.log(`• Created admin account for ${phone}.`);
  }
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: 'admin' });
  console.log(`✓ ${phone} can now sign in to the admin dashboard.`);
} catch (err) {
  console.error(`✗ ${err.code ?? 'error'}: ${err.message}`);
  process.exit(1);
}
