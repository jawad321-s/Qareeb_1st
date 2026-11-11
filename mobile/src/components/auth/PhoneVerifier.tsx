import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SDK_VERSION } from 'firebase/app';
import type { ApplicationVerifier } from 'firebase/auth';
import { Header } from '@/components/ui/Header';
import { Text } from '@/components/ui/Text';
import { config } from '@/lib/config';
import { useT } from '@/i18n';
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

type Pending = { resolve: (token: string) => void; reject: (err: Error) => void };

/**
 * A reCAPTCHA verifier for Firebase phone verification on iOS and Android.
 * Render `modal` once; `verifier` opens it when Firebase asks for a check.
 */
export function usePhoneVerifier(): { verifier: ApplicationVerifier; modal: React.ReactElement } {
  const { t } = useT();
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const pending = useRef<Pending | null>(null);

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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
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

  return { verifier, modal };
}
