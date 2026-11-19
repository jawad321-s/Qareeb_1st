'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { Avatar } from '@heroui/react';
import { LogOut, Moon, Sun, Languages } from 'lucide-react';
import { signOut } from '@/lib/session';
import { useT } from '@/lib/i18n';
import { MobileNav } from './sidebar';
import { NotificationsMenu } from './notifications-menu';

/** Light / dark, as the <html> class says. */
function useThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };
  return { dark, toggle };
}

/**
 * The foot of the sidebar (and of the phone menu): the bell, the language and
 * the theme, then who is signed in and signing out. They used to sit in a top
 * bar across the page.
 */
export function AccountControls({ bell = true }: { bell?: boolean }) {
  const { t, locale, toggle } = useT();
  const router = useRouter();
  const theme = useThemeToggle();

  const logout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <div className="shrink-0 space-y-3 border-t border-base p-3">
      <div className="flex items-center gap-2">
        {bell && <NotificationsMenu placement="up" />}
        <Button variant="outline" isIconOnly aria-label="theme" onPress={theme.toggle}>
          {theme.dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </Button>
        <Button variant="outline" className="flex-1" onPress={toggle}>
          <Languages className="h-[18px] w-[18px]" />
          {locale === 'ar' ? 'English' : 'العربية'}
        </Button>
      </div>
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-500/5 p-2">
        <Avatar>
          <Avatar.Fallback className="bg-gradient-to-br from-brand-400 to-accent-400 text-sm font-bold text-white">A</Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{t('topbar.admin')}</p>
          <p className="truncate text-xs text-muted">{t('topbar.superAdmin')}</p>
        </div>
        <Button variant="ghost" isIconOnly aria-label={t('topbar.signOut')} onPress={logout} className="text-muted hover:text-red-500">
          <LogOut className="h-[18px] w-[18px] rtl:-scale-x-100" />
        </Button>
      </div>
    </div>
  );
}

/**
 * On a narrow screen the sidebar is hidden: a slim bar with the menu (which
 * holds everything else) and the bell.
 */
export function MobileBar() {
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-base glass px-4 lg:hidden">
      <MobileNav />
      <NotificationsMenu />
    </header>
  );
}
