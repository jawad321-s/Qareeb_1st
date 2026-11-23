// ─────────────────────────────────────────────────────────────────────────────
// Qareeb — reCAPTCHA SMS defense for phone sign-in (sign-up and forgot-password
// codes).
//
// Google doesn't text some carriers (Palestinian lines among them: error-code
// -39) unless the project has reCAPTCHA SMS defense on in ENFORCE mode (Firebase
// support, Nov 2026). The app already sends the Enterprise token it then needs.
//
// First, once: Google Cloud console → APIs → "reCAPTCHA Enterprise API" → Enable.
// The Firebase console's Authentication → Settings → Fraud Defense page may
// then offer these settings itself; this script sets them when it doesn't.
//
// Usage (inside firebase/):
//   npm run sms-defense                    show the current settings
//   npm run sms-defense -- audit [score]   score requests, block nothing
//   npm run sms-defense -- enforce [score] block requests whose toll-fraud
//                                          risk is above `score` (0–1, default 0.8)
//   npm run sms-defense -- off             back to no SMS defense
//
// Only the phone settings change; email/password sign-in is left as it is.
// Credentials as in set-role.mjs (seed/service-account.json, or
// GOOGLE_APPLICATION_CREDENTIALS).
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import admin from 'firebase-admin';

const [mode, scoreArg] = process.argv.slice(2);
const MODES = ['audit', 'enforce', 'off'];
if (mode && !MODES.includes(mode)) {
  console.error(`Usage: npm run sms-defense -- [${MODES.join('|')}] [score]`);
  process.exit(1);
}
const score = scoreArg === undefined ? 0.8 : Number(scoreArg);
if (!(score >= 0 && score <= 1)) {
  console.error('The score is a number from 0 to 1 (e.g. 0.8).');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, '..', 'seed', 'service-account.json');
if (existsSync(keyPath)) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
} else {
  admin.initializeApp();
}

const show = (label, config) => {
  const r = config.recaptchaConfig ?? {};
  console.log(`${label}:`);
  console.log(`  phone (SMS) protection : ${r.phoneEnforcementState ?? 'OFF'}`);
  console.log(`  SMS toll-fraud defense : ${r.useSmsTollFraudProtection ? 'on' : 'off'}`);
  console.log(`  block above risk score : ${(r.smsTollFraudManagedRules ?? []).map((x) => x.startScore).join(', ') || '—'}`);
  console.log(`  email/password         : ${r.emailPasswordEnforcementState ?? 'OFF'} (not changed here)`);
};

try {
  const manager = admin.auth().projectConfigManager();
  show('Now', await manager.getProjectConfig());
  if (!mode) process.exit(0);

  const recaptchaConfig =
    mode === 'off'
      ? { phoneEnforcementState: 'OFF', useSmsTollFraudProtection: false }
      : {
          phoneEnforcementState: mode.toUpperCase(),
          useSmsTollFraudProtection: true,
          useSmsBotScore: false,
          smsTollFraudManagedRules: [{ startScore: score, action: 'BLOCK' }],
        };
  show('After', await manager.updateProjectConfig({ recaptchaConfig }));
  console.log('\n✓ Saved. Try one code from the app in a minute or two.');
} catch (err) {
  console.error(`✗ ${err.code ?? 'error'}: ${err.message}`);
  if (/recaptcha|SERVICE_DISABLED|has not been used|disabled/i.test(String(err.message))) {
    console.error('  Enable the "reCAPTCHA Enterprise API" for the project in the Google Cloud console first.');
  }
  process.exit(1);
}
