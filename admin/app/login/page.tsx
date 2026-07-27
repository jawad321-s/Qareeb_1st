'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Lock, Mail } from 'lucide-react';
import { Button, Input } from '@/components/ui/primitives';
import { signIn } from '@/lib/session';
import { useT } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, toggle } = useT();
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
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Language switch — reachable before signing in */}
      <button
        onClick={toggle}
        className="absolute end-6 top-6 z-10 flex h-10 items-center gap-1.5 rounded-xl border border-base px-3 text-sm font-medium hover:bg-slate-500/10"
      >
        <Languages className="h-[18px] w-[18px]" />
        {locale === 'ar' ? 'EN' : 'ع'}
      </button>
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-accent-500 lg:block">
        <div className="flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
              <img src="/brand/mark-white.png" alt="قريب" className="h-7 w-auto" />
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
              <Mail className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={t('login.email')}
                type="email"
                autoComplete="email"
                className="ps-10"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="ps-10"
              />
            </div>
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <Button className="w-full" onClick={submit}>
              {t('login.signIn')}
            </Button>
          </div>
          <p className="text-center text-xs text-muted">{t('login.rbac')}</p>
        </div>
      </div>
    </div>
  );
}
