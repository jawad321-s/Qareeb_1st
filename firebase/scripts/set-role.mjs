// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — assign a role (custom claim) to an existing Firebase Auth user.
//
// Usage (inside firebase/):
//   npm run set-role -- <email> <admin|artisan|customer>
//
// Security rules read `request.auth.token.role`, which can only be set from the
// server via the Admin SDK — this script does exactly that. Credentials are
// resolved the same way as the seed script (seed/service-account.json, or
// GOOGLE_APPLICATION_CREDENTIALS). The user must sign out and back in (or
// refresh their ID token) for the new role to take effect.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const ROLES = ['admin', 'artisan', 'customer'];
const [email, role] = process.argv.slice(2);

if (!email || !ROLES.includes(role)) {
  console.error(`Usage: npm run set-role -- <email> <${ROLES.join('|')}>`);
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, '..', 'seed', 'service-account.json');

if (existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
} else {
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS / ADC.
  admin.initializeApp();
}

try {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role });

  // Keep the profile document in sync when one exists (admins may have none).
  const ref = admin.firestore().collection('users').doc(user.uid);
  if ((await ref.get()).exists) await ref.update({ role });

  console.log(`✓ ${email} (${user.uid}) → role=${role}`);
  console.log('  Sign out and back in for the new role to take effect.');
} catch (err) {
  console.error(`✗ ${err.code ?? 'error'}: ${err.message}`);
  process.exit(1);
}
