import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SDK_VERSION } from 'firebase/app';
import type { ApplicationVerifier } from 'firebase/auth';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { config } from '@/lib/config';
import { useT } from '@/i18n';
import { directionStyle } from '@/i18n/rtl';
import { useTheme } from '@/theme/ThemeProvider';

// Firebase only sends an SMS code after a reCAPTCHA check, and reCAPTCHA needs
// a web page. This page runs Firebase's own RecaptchaVerifier ("I'm not a
// robot") inside a WebView, served as if from the project's auth domain, and
// hands the token back to the app.
const page = () => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth-compat.js"></script>
<style>html,body{height:100%;margin:0}body{display:flex;align-items:flex-start;justify-content:center;padding-top:24px;background:transparent}</style>
</head><body><div id="recaptcha"></div><script>
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
try {
  firebase.initializeApp(${JSON.stringify(config.firebase)});
  firebase.auth().languageCode = 'ar';
  var verifier = new firebase.auth.RecaptchaVerifier('recaptcha', {
    size: 'normal',
    callback: function (token) { post({ type: 'token', token: token }); },
    'expired-callback': function () { post({ type: 'expired' }); }
  });
  verifier.render().then(function () { post({ type: 'ready' }); }, function (e) { post({ type: 'error', message: String(e) }); });
} catch (e) { post({ type: 'error', message: String(e) }); }
</script></body></html>`;

// reCAPTCHA Enterprise ("SMS defense"). Google only texts some carriers
// (Palestinian lines among them) when the project has SMS defense on, and then
// Firebase asks for an Enterprise token through window.grecaptcha.enterprise:
// a browser script that phones don't have. usePhoneVerifier stands in for it:
// the token comes from a hidden page, served as if from the auth domain, that
// runs Google's enterprise script for the action Firebase names. It is a
// background score, nothing to tap. While SMS defense is off, Firebase never
// asks and the "I'm not a robot" check above is used, as before.
const enterprisePage = (siteKey: string, action: string) => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><script>
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
function go(){
  try {
    grecaptcha.enterprise.ready(function () {
      grecaptcha.enterprise.execute(${JSON.stringify(siteKey)}, { action: ${JSON.stringify(action)} }).then(
        function (t) { post({ type: 'enterprise-token', token: t }); },
        function (e) { post({ type: 'enterprise-error', message: String(e) }); });
    });
  } catch (e) { post({ type: 'enterprise-error', message: String(e) }); }
}
</script><script src="https://www.google.com/recaptcha/enterprise.js?render=${encodeURIComponent(siteKey)}" onload="go()" onerror="post({type:'enterprise-error',message:'load'})"></script>
</body></html>`;

/** How long the hidden Enterprise check may take before it counts as failed. */
const ENTERPRISE_TIMEOUT_MS = 20_000;

type Pending = { resolve: (token: string) => void; reject: (err: Error) => void };

/**
 * A reCAPTCHA verifier for Firebase phone verification on iOS and Android.
 * Render `modal` once; `verifier` opens it when Firebase asks for a check.
 */
export function usePhoneVerifier(): { verifier: ApplicationVerifier; modal: React.ReactElement } {
  const { t, isRTL } = useT();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const pending = useRef<Pending | null>(null);
  // The hidden Enterprise check, while one runs.
  const [enterprise, setEnterprise] = useState<{ siteKey: string; action: string } | null>(null);
  const enterprisePending = useRef<(Pending & { timer: ReturnType<typeof setTimeout> }) | null>(null);

  const finishEnterprise = (result: { token?: string; error?: Error }) => {
    const p = enterprisePending.current;
    enterprisePending.current = null;
    if (p) clearTimeout(p.timer);
    setEnterprise(null);
    if (result.token) p?.resolve(result.token);
    else p?.reject(result.error ?? new Error('recaptcha-enterprise-failed'));
  };
  const askEnterprise = useRef<(siteKey: string, action: string) => Promise<string>>(() => Promise.reject(new Error('not-ready')));
  askEnterprise.current = (siteKey, action) =>
    new Promise<string>((resolve, reject) => {
      // One check at a time: a newer request replaces an unanswered one.
      enterprisePending.current?.reject(new Error('recaptcha-enterprise-replaced'));
      const timer = setTimeout(() => finishEnterprise({ error: new Error('recaptcha-enterprise-timeout') }), ENTERPRISE_TIMEOUT_MS);
      enterprisePending.current = { resolve, reject, timer };
      setEnterprise({ siteKey, action });
    });

  // Stand in for the browser's grecaptcha.enterprise while this screen is up.
  useEffect(() => {
    const g = globalThis as unknown as { grecaptcha?: unknown };
    const before = g.grecaptcha;
    g.grecaptcha = {
      enterprise: {
        ready: (done: () => void) => done(),
        execute: (siteKey: string, options?: { action?: string }) => {
          const action = options?.action ?? 'verify';
          // Firebase warms up with a throwaway check when it loads its
          // settings: nothing is sent with it, so nothing runs for it.
          if (action === 'verify') return Promise.resolve('');
          return askEnterprise.current(siteKey, action);
        },
      },
    };
    return () => {
      g.grecaptcha = before;
      enterprisePending.current?.reject(new Error('recaptcha-cancelled'));
      if (enterprisePending.current) clearTimeout(enterprisePending.current.timer);
      enterprisePending.current = null;
    };
  }, []);

  const onEnterpriseMessage = (e: WebViewMessageEvent) => {
    let m: { type: string; token?: string; message?: string };
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.type === 'enterprise-token' && m.token) finishEnterprise({ token: m.token });
    else if (m.type === 'enterprise-error') finishEnterprise({ error: new Error(`recaptcha-enterprise-failed: ${m.message ?? ''}`) });
  };

  const finish = (result: { token?: string; error?: Error }) => {
    const p = pending.current;
    pending.current = null;
    setVisible(false);
    setReady(false);
    if (result.token) p?.resolve(result.token);
    else p?.reject(result.error ?? new Error('recaptcha-cancelled'));
  };

  const verifier = useMemo(
    () =>
      ({
        type: 'recaptcha',
        verify: () =>
          new Promise<string>((resolve, reject) => {
            pending.current = { resolve, reject };
            setVisible(true);
          }),
        // Called by Firebase after each send; a fresh check opens next time.
        _reset: () => {},
      }) as ApplicationVerifier,
    [],
  );

  const onMessage = (e: WebViewMessageEvent) => {
    let m: { type: string; token?: string; message?: string };
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.type === 'ready') setReady(true);
    else if (m.type === 'token' && m.token) finish({ token: m.token });
    else if (m.type === 'error') finish({ error: new Error(`recaptcha-failed: ${m.message ?? ''}`) });
  };

  const modal = (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => finish({})}>
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }, directionStyle(isRTL)]} edges={['top', 'bottom']}>
        <View style={{ paddingHorizontal: 20 }}>
          <Header showBack onBack={() => finish({})} title={t('reset.robotTitle')} subtitle={t('reset.robotDesc')} />
        </View>
        {visible && (
          <WebView
            originWhitelist={['*']}
            javaScriptEnabled
            source={{ html: page(), baseUrl: `https://${config.firebase.authDomain}` }}
            onMessage={onMessage}
            onError={() => finish({ error: new Error('recaptcha-failed: load') })}
            style={{ flex: 1, backgroundColor: 'transparent' }}
          />
        )}
        {!ready && (
          <View style={{ position: 'absolute', top: 160, left: 0, right: 0, alignItems: 'center', gap: 10 }} pointerEvents="none">
            <ActivityIndicator color={colors.tint} />
            <Text variant="caption" tone="muted">
              {t('reset.robotLoading')}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  return {
    verifier,
    modal: (
      <>
        {modal}
        {/* The hidden Enterprise check (see enterprisePage). */}
        {enterprise && (
          <View pointerEvents="none" style={{ position: 'absolute', width: 2, height: 2, opacity: 0, overflow: 'hidden' }}>
            <WebView
              originWhitelist={['*']}
              javaScriptEnabled
              source={{ html: enterprisePage(enterprise.siteKey, enterprise.action), baseUrl: `https://${config.firebase.authDomain}` }}
              onMessage={onEnterpriseMessage}
              onError={() => finishEnterprise({ error: new Error('recaptcha-enterprise-failed: load') })}
              style={{ width: 2, height: 2 }}
            />
          </View>
        )}
      </>
    ),
  };
}
