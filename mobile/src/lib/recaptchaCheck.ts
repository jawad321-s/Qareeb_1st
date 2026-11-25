// Diagnostic, while SMS defense is being set up (remove once SMS codes reach
// Palestinian numbers): when Firebase calls a reCAPTCHA token invalid, it says
// no more than that. This takes a fresh token the same way (the hidden page on
// phones, Google's own script on the web) and asks reCAPTCHA itself what it
// thinks of it — valid or not, why not, which site it came from, its score —
// and prints the answer in the start-app window. With the number the code was
// for, reCAPTCHA also gives its SMS toll-fraud risk for it: SMS defense blocks
// numbers whose risk is at or above the threshold set on the project.
import { config } from '@/lib/config';

const ACTION = 'sendVerificationCode';

type Enterprise = { execute: (siteKey: string, o: { action: string }) => Promise<string> };

export async function explainRecaptchaFailure(phoneNumber?: string): Promise<void> {
  const { apiKey, projectId } = config.firebase;
  try {
    const cfg = await fetch(
      `https://identitytoolkit.googleapis.com/v2/recaptchaConfig?clientType=CLIENT_TYPE_WEB&version=RECAPTCHA_ENTERPRISE&key=${apiKey}`,
    ).then((r) => r.json());
    const siteKey = String(cfg?.recaptchaKey ?? '').split('/').pop();
    const enterprise = (globalThis as { grecaptcha?: { enterprise?: Enterprise } }).grecaptcha?.enterprise;
    if (!siteKey || !enterprise) {
      console.log(`[reCAPTCHA] diagnosis: no ${siteKey ? 'reCAPTCHA script' : 'site key'} (${JSON.stringify(cfg).slice(0, 200)})`);
      return;
    }
    const token = await enterprise.execute(siteKey, { action: ACTION });
    const res = await fetch(`https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: { token, siteKey, expectedAction: ACTION, ...(phoneNumber ? { userInfo: { userIds: [{ phoneNumber }] } } : {}) },
      }),
    }).then((r) => r.json());
    const tp = res?.tokenProperties ?? {};
    console.log(
      `[reCAPTCHA] diagnosis: valid=${tp.valid} reason=${tp.invalidReason ?? '-'} host=${tp.hostname ?? '-'} action=${tp.action ?? '-'} ` +
        `score=${res?.riskAnalysis?.score ?? '-'} smsTollFraud=${JSON.stringify(res?.phoneFraudAssessment ?? '-')} ` +
        `${res?.error ? `error=${JSON.stringify(res.error).slice(0, 300)}` : ''}`,
    );
  } catch (e) {
    console.log(`[reCAPTCHA] diagnosis failed: ${(e as Error)?.message ?? String(e)}`);
  }
}
