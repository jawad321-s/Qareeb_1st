// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — create (or update) an admin account for the admin dashboard, which
// signs in with an email and a password.
//
// Usage (inside firebase/):
//   node scripts/create-admin.mjs <email> <password>
//   e.g. node scripts/create-admin.mjs admin@example.com 'a-strong-password'
//   (or: npm run create-admin -- <email> <password>)
//
// The account gets the `role: "admin"` custom claim the dashboard and the
// security rules check. Running it again for the same email resets the
// password. Credentials: seed/service-account.json or
// GOOGLE_APPLICATION_CREDENTIALS (same as the seed script).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const [emailArg = '', password] = process.argv.slice(2);
const email = emailArg.trim().toLowerCase();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 6) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password, 6+ characters>');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, '..', 'seed', 'service-account.json');
if (existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
} else {
  admin.initializeApp();
}

try {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    user = await admin.auth().updateUser(user.uid, { password });
    console.log(`• Admin account for ${email} already existed — password updated.`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    user = await admin.auth().createUser({ email, password, emailVerified: true, displayName: 'Qareeb Admin' });
    console.log(`• Created admin account for ${email}.`);
  }
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: 'admin' });
  console.log(`✓ ${email} can now sign in to the admin dashboard.`);
} catch (err) {
  console.error(`✗ ${err.code ?? 'error'}: ${err.message}`);
  process.exit(1);
}
