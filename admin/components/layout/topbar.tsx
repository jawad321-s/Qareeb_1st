'use client';

import { useEffect, useState } from 'react';
import { Bell, Moon, Search, Sun } from 'lucide-react';

export function Topbar() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-base glass px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          placeholder="Search users, requests, artisans…"
          className="h-10 w-full rounded-xl border border-base bg-transparent pl-10 pr-4 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <button onClick={toggle} className="grid h-10 w-10 place-items-center rounded-xl border border-base hover:bg-slate-500/10">
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
          <p className="text-sm font-semibold leading-none">Admin</p>
          <p className="text-[11px] text-muted">Super admin</p>
        </div>
      </div>
    </header>
  );
}
