'use client';

import { useEffect, useState } from 'react';
import { Check, FileText, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, StatusPill } from '@/components/ui/primitives';
import { type VerificationItem } from '@/lib/mock-data';
import { subscribeVerifications, decideVerification } from '@/lib/verification.service';
import { isLive } from '@/lib/firebase';
import { timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function ArtisansPage() {
  const { t, locale } = useT();
  const [items, setItems] = useState<VerificationItem[]>([]);

  // Live queue from Firestore (falls back to the mock list on mock mode).
  useEffect(() => subscribeVerifications(setItems), []);

  const decide = (item: VerificationItem, status: 'approved' | 'rejected') => {
    // Optimistic UI; persists to Firestore when live.
    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, status } : v)));
    void decideVerification(item, status);
  };

  const pending = items.filter((v) => v.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('ver.title')}</h1>
          <p className="text-sm text-muted">{pending.length} {t('ver.subtitle')}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-xl bg-brand-500/10 px-3 py-2 text-sm font-medium text-brand-500">
          <ShieldCheck className="h-4 w-4" /> {pending.length} {t('ver.pending')}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence>
          {items.map((v) => (
            <motion.div key={v.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-400 text-sm font-bold text-white">
                      {v.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-xs text-muted">{v.category} · {t('ver.submitted')} {timeAgo(v.submittedAt, locale)}</p>
                    </div>
                  </div>
                  <StatusPill status={v.status} />
                </div>

                <div className="mt-4 flex gap-2">
                  {[t('ver.idFront'), t('ver.idBack'), t('ver.certificate')].map((doc) => (
                    <div key={doc} className="flex flex-1 items-center gap-2 rounded-xl border border-base px-3 py-2 text-xs text-muted">
                      <FileText className="h-4 w-4" /> {doc}
                    </div>
                  ))}
                </div>

                {v.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => decide(v, 'rejected')}>
                      <X className="h-4 w-4" /> {t('ver.reject')}
                    </Button>
                    <Button className="flex-1" onClick={() => decide(v, 'approved')}>
                      <Check className="h-4 w-4" /> {t('ver.approve')}
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
