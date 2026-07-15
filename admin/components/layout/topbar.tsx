'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, Search, Sun, Languages } from 'lucide-react';
import { signOut } from '@/lib/session';
import { useT } from '@/lib/i18n';

export function Topbar() {
  const { t, locale, toggle } = useT();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  const logout = () => {
    signOut();
    router.replace('/login');
  };

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-base glass px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          placeholder={t('topbar.search')}
          className="h-10 w-full rounded-xl border border-base bg-transparent ps-10 pe-4 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <button onClick={toggle} className="flex h-10 items-center gap-1.5 rounded-xl border border-base px-3 text-sm font-medium hover:bg-slate-500/10">
        <Languages className="h-[18px] w-[18px]" />
        {locale === 'ar' ? 'EN' : 'ع'}
      </button>
      <button onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-xl border border-base hover:bg-slate-500/10">
        {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </button>
      <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-base hover:bg-slate-500/10">
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
      </button>
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-accent-400 text-sm font-bold text-white">
          A
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none">{t('topbar.admin')}</p>
          <p className="text-[11px] text-muted">{t('topbar.superAdmin')}</p>
        </div>
      </div>
      <button
        onClick={logout}
        title={t('topbar.signOut')}
        className="grid h-10 w-10 place-items-center rounded-xl border border-base text-muted hover:bg-red-500/10 hover:text-red-500"
      >
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </header>
  );
}
