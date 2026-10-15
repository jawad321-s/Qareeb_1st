'use client';

import { useEffect, useState } from 'react';
import { Check, FileText, Loader2, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Button, StatusPill } from '@/components/ui/primitives';
import { type VerificationItem } from '@/lib/mock-data';
import { subscribeVerifications, decideVerification, loadVerificationPhotos, type VerificationPhoto } from '@/lib/verification.service';
import { artisanCategories, categoryNames, useCollection } from '@/lib/live-data';
import { isLive } from '@/lib/firebase';
import { timeAgo } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function ArtisansPage() {
  const { t, locale } = useT();
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [viewing, setViewing] = useState<VerificationItem | null>(null);
  // Current categories per artisan (null on mock / while loading).
  const profiles = useCollection('artisanProfiles');

  // Live queue from Firestore (falls back to the mock list on mock mode).
  useEffect(() => subscribeVerifications(setItems), []);

  const decide = (item: VerificationItem, status: 'approved' | 'rejected') => {
    // Optimistic UI; persists to Firestore when live.
    setItems((prev) => prev.map((v) => (v.id === item.id ? { ...v, status } : v)));
    void decideVerification(item, status);
    setViewing(null);
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
                      <p className="text-xs text-muted">{categoryNames(artisanCategories(v.artisanId, profiles, v), locale)} · {t('ver.submitted')} {timeAgo(v.submittedAt, locale)}</p>
                      {v.phone && <p className="text-xs text-muted" dir="ltr">{v.phone}</p>}
                    </div>
                  </div>
                  <StatusPill status={v.status} />
                </div>

                {v.hasDocuments === false ? (
                  <p className="mt-4 rounded-xl border border-dashed border-base px-3 py-2 text-xs text-muted">{t('ver.noDocs')}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewing(v)}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-base px-3 py-2 text-sm font-medium hover:bg-slate-500/10"
                  >
                    <FileText className="h-4 w-4" /> {t('ver.viewDocs')}
                    {v.files?.length ? ` (${v.files.length})` : ''}
                  </button>
                )}

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

      {viewing && <DocumentsModal item={viewing} onClose={() => setViewing(null)} onDecide={decide} />}
    </div>
  );
}

/** The artisan's ID / selfie / certificate photos, with approve and reject at hand. */
function DocumentsModal({
  item,
  onClose,
  onDecide,
}: {
  item: VerificationItem;
  onClose: () => void;
  onDecide: (item: VerificationItem, status: 'approved' | 'rejected') => void;
}) {
  const { t } = useT();
  const [photos, setPhotos] = useState<VerificationPhoto[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState<VerificationPhoto | null>(null);

  useEffect(() => {
    let alive = true;
    loadVerificationPhotos(item)
      .then((p) => alive && setPhotos(p))
      .catch((err) => {
        console.warn('[verification photos]', err);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (zoomed) setZoomed(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomed, onClose]);

  const label = (name: string) => {
    if (name === 'idFront') return t('ver.idFront');
    if (name === 'idBack') return t('ver.idBack');
    if (name === 'selfie') return t('ver.selfie');
    const n = name.match(/^certificate-(\d+)$/)?.[1];
    return n ? `${t('ver.certificate')} ${n}` : name;
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="surface max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{item.name}</p>
            {item.phone && <p className="text-xs text-muted" dir="ltr">{item.phone}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label={t('ver.close')} className="rounded-lg p-1.5 hover:bg-slate-500/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {failed ? (
          <p className="py-10 text-center text-sm text-muted">{t('ver.docsFailed')}</p>
        ) : !photos ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> {t('ver.loadingDocs')}
          </p>
        ) : photos.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t('ver.noPhotos')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {photos.map((p) => (
              <figure key={p.name} className="space-y-1.5">
                <button type="button" onClick={() => setZoomed(p)} className="block w-full cursor-zoom-in">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from Firestore */}
                  <img src={p.url} alt={label(p.name)} className="h-56 w-full rounded-xl bg-slate-500/10 object-contain" />
                </button>
                <figcaption className="text-xs text-muted">{label(p.name)}</figcaption>
              </figure>
            ))}
          </div>
        )}

        {item.status === 'pending' && (
          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onDecide(item, 'rejected')}>
              <X className="h-4 w-4" /> {t('ver.reject')}
            </Button>
            <Button className="flex-1" onClick={() => onDecide(item, 'approved')}>
              <Check className="h-4 w-4" /> {t('ver.approve')}
            </Button>
          </div>
        )}
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-[60] grid cursor-zoom-out place-items-center bg-black/85 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from Firestore */}
          <img src={zoomed.url} alt={label(zoomed.name)} className="max-h-[90vh] max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
