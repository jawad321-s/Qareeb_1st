'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { signIn } from '@/lib/session';
import { useT } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
      setError(t('login.errInvalid'));
      return;
    }
    signIn(email);
    router.push('/');
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-accent-500 lg:block">
        <div className="flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
              <Wrench className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">{t('app.name')}</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">{t('login.console')}</h1>
            <p className="mt-3 max-w-md text-white/80">
              {t('login.tagline')}
            </p>
          </div>
          <p className="text-sm text-white/60">{t('login.copyright')}</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{t('login.welcomeBack')}</h2>
            <p className="text-sm text-muted">{t('login.subtitle')}</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={t('login.email')}
                type="email"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-base bg-transparent ps-10 pe-4 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-base bg-transparent ps-10 pe-4 text-sm outline-none focus:border-brand-500"
              />
            </div>
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <Button className="h-11 w-full" onClick={submit}>
              {t('login.signIn')}
            </Button>
          </div>
          <p className="text-center text-xs text-muted">{t('login.rbac')}</p>
        </div>
      </div>
    </div>
  );
}
