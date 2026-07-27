'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { Avatar } from '@heroui/react';
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
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-base glass px-6">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input fullWidth placeholder={t('topbar.search')} className="ps-10" />
      </div>
      <Button variant="outline" onPress={toggle}>
        <Languages className="h-[18px] w-[18px]" />
        {locale === 'ar' ? 'EN' : 'ع'}
      </Button>
      <Button variant="outline" isIconOnly aria-label="theme" onPress={toggleTheme}>
        {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </Button>
      <div className="relative">
        <Button variant="outline" isIconOnly aria-label={t('topbar.search')}>
          <Bell className="h-[18px] w-[18px]" />
        </Button>
        <span className="pointer-events-none absolute end-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      </div>
      <div className="flex items-center gap-2.5">
        <Avatar>
          <Avatar.Fallback className="bg-gradient-to-br from-brand-400 to-accent-400 text-sm font-bold text-white">
            A
          </Avatar.Fallback>
        </Avatar>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none">{t('topbar.admin')}</p>
          <p className="text-[11px] text-muted">{t('topbar.superAdmin')}</p>
        </div>
      </div>
      <Button variant="ghost" isIconOnly aria-label={t('topbar.signOut')} onPress={logout} className="text-muted hover:text-red-500">
        <LogOut className="h-[18px] w-[18px]" />
      </Button>
    </header>
  );
}
