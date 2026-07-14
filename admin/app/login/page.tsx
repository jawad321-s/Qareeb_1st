'use client';

import { useRouter } from 'next/navigation';
import { Lock, Mail, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-accent-500 lg:block">
        <div className="flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
              <Wrench className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold">Qareeb</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight">Admin console</h1>
            <p className="mt-3 max-w-md text-white/80">
              Manage users, verify artisans, monitor requests and track revenue — all in one enterprise dashboard.
            </p>
          </div>
          <p className="text-sm text-white/60">© 2026 Qareeb. All rights reserved.</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted">Sign in to the Qareeb admin console.</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input placeholder="admin@qareeb.app" className="h-11 w-full rounded-xl border border-base bg-transparent pl-10 pr-4 text-sm outline-none focus:border-brand-500" />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input type="password" placeholder="••••••••" className="h-11 w-full rounded-xl border border-base bg-transparent pl-10 pr-4 text-sm outline-none focus:border-brand-500" />
            </div>
            <Button className="h-11 w-full" onClick={() => router.push('/')}>
              Sign in
            </Button>
          </div>
          <p className="text-center text-xs text-muted">Protected by role-based access control.</p>
        </div>
      </div>
    </div>
  );
}
