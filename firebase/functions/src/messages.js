// Notification copy, written in the recipient's language (users/{uid}.locale).
const money = (minor) => `${Math.round((Number(minor) || 0) / 100)} ₪`;
const clip = (s = '', n = 120) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export const MESSAGES = {
  newJob: {
    ar: (p) => ({ title: 'طلب جديد قريب منك', body: `${clip(p.title, 60)} — على بعد ${p.distanceKm.toFixed(1)} كم` }),
    en: (p) => ({ title: 'New job near you', body: `${clip(p.title, 60)} — ${p.distanceKm.toFixed(1)} km away` }),
  },
  newOffer: {
    ar: (p) => ({ title: 'عرض جديد على طلبك', body: `${p.artisanName} قدّم عرضاً بـ ${money(p.price)}` }),
    en: (p) => ({ title: 'New offer on your request', body: `${p.artisanName} offered ${money(p.price)}` }),
  },
  offerAccepted: {
    ar: (p) => ({ title: 'تم قبول عرضك 🎉', body: `قبل ${p.customerName} عرضك لـ "${clip(p.title, 60)}"` }),
    en: (p) => ({ title: 'Your offer was accepted 🎉', body: `${p.customerName} accepted your offer for "${clip(p.title, 60)}"` }),
  },
  onTheWay: {
    ar: (p) => ({ title: 'الحرفي بالطريق', body: `${p.artisanName} بالطريق إليك` }),
    en: (p) => ({ title: 'Artisan on the way', body: `${p.artisanName} is on the way` }),
  },
  working: {
    ar: (p) => ({ title: 'بدأ العمل', body: `${p.artisanName} بدأ العمل على طلبك` }),
    en: (p) => ({ title: 'Work started', body: `${p.artisanName} started working on your request` }),
  },
  completed: {
    ar: (p) => ({ title: 'اكتمل العمل', body: `اكتمل "${clip(p.title, 60)}". قيّم التجربة الآن` }),
    en: (p) => ({ title: 'Job completed', body: `"${clip(p.title, 60)}" is complete. Leave a rating now` }),
  },
  cancelledByOther: {
    ar: (p) => ({ title: 'تم إلغاء الطلب', body: `ألغى ${p.byName} طلب "${clip(p.title, 60)}"` }),
    en: (p) => ({ title: 'Request cancelled', body: `${p.byName} cancelled "${clip(p.title, 60)}"` }),
  },
  noOffers: {
    ar: (p) => ({ title: 'لم نجد حرفياً متاحاً', body: `انتهت مهلة طلب "${clip(p.title, 60)}" بدون عروض وتم إلغاؤه. جرّب مرة أخرى لاحقاً` }),
    en: (p) => ({ title: 'No artisan available', body: `"${clip(p.title, 60)}" got no offers in time and was cancelled. Please try again later` }),
  },
  newMessage: {
    ar: (p) => ({ title: p.senderName, body: p.text ? clip(p.text) : '📷 صورة' }),
    en: (p) => ({ title: p.senderName, body: p.text ? clip(p.text) : '📷 Photo' }),
  },
};

export function render(type, locale, params) {
  const m = MESSAGES[type];
  return (m[locale] ?? m.ar)(params);
}
