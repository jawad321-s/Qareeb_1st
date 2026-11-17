// Notification copy, written in the recipient's language (users/{uid}.locale).
const money = (minor) => `${Math.round((Number(minor) || 0) / 100)} ₪`;
const clip = (s = '', n = 120) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

// Why a request was cancelled or an offer turned down. Keep the codes in sync
// with the app (mobile/src/lib/reasons.ts).
const REASONS = {
  // Customer cancelling a request
  changed_mind: { ar: 'لم يعد بحاجة للخدمة', en: 'no longer needs the service' },
  found_other: { ar: 'وجد حلاً آخر', en: 'found another solution' },
  too_long: { ar: 'الانتظار طويل', en: 'waiting too long' },
  price: { ar: 'السعر غير مناسب', en: 'the price did not suit' },
  // Artisan cancelling a job
  not_available: { ar: 'لم يعد متاحاً', en: 'no longer available' },
  too_far: { ar: 'المكان بعيد', en: 'too far away' },
  customer_unreachable: { ar: 'تعذّر التواصل مع الزبون', en: 'could not reach the customer' },
  job_mismatch: { ar: 'العمل يختلف عن الوصف', en: 'the job differs from the description' },
  // Customer turning down an offer
  price_high: { ar: 'السعر مرتفع', en: 'the price is high' },
  eta_long: { ar: 'وقت الوصول طويل', en: 'arrival time is long' },
  other: { ar: 'سبب آخر', en: 'another reason' },
};
/** "the reason: …" in the recipient's language, or '' when none was given. */
const why = (p, locale) => {
  const label = REASONS[p.choice]?.[locale];
  const parts = [label, clip(p.note ?? '', 120)].filter(Boolean);
  if (!parts.length) return '';
  return locale === 'ar' ? ` السبب: ${parts.join(' — ')}` : ` Reason: ${parts.join(' — ')}`;
};

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
    ar: (p) => ({ title: 'تم إلغاء الطلب', body: `ألغى ${p.byName} طلب "${clip(p.title, 60)}".${why(p, 'ar')}` }),
    en: (p) => ({ title: 'Request cancelled', body: `${p.byName} cancelled "${clip(p.title, 60)}".${why(p, 'en')}` }),
  },
  // To artisans who sent an offer, when the customer cancels before accepting one.
  requestCancelledPending: {
    ar: (p) => ({ title: 'تم إلغاء الطلب', body: `ألغى الزبون طلب "${clip(p.title, 60)}" الذي قدّمت عليه عرضاً.${why(p, 'ar')}` }),
    en: (p) => ({ title: 'Request cancelled', body: `The customer cancelled "${clip(p.title, 60)}", which you made an offer on.${why(p, 'en')}` }),
  },
  offerRejected: {
    ar: (p) => ({ title: 'تم رفض عرضك', body: `رفض الزبون عرضك على "${clip(p.title, 60)}".${why(p, 'ar')}` }),
    en: (p) => ({ title: 'Your offer was declined', body: `The customer declined your offer on "${clip(p.title, 60)}".${why(p, 'en')}` }),
  },
  offerNotChosen: {
    ar: (p) => ({ title: 'اختار الزبون عرضاً آخر', body: `قبل الزبون عرضاً آخر على "${clip(p.title, 60)}"` }),
    en: (p) => ({ title: 'Another offer was chosen', body: `The customer accepted another offer on "${clip(p.title, 60)}"` }),
  },
  requestExpired: {
    ar: (p) => ({ title: 'انتهت مهلة الطلب', body: `مرّت 30 دقيقة على طلب "${clip(p.title, 60)}" بدون قبول أي عرض، فتم إلغاؤه. تقدر تنشره من جديد` }),
    en: (p) => ({ title: 'Request expired', body: `No offer on "${clip(p.title, 60)}" was accepted within 30 minutes, so it was cancelled. You can post it again` }),
  },
  offerExpired: {
    ar: (p) => ({ title: 'انتهت مهلة الطلب', body: `الزبون ما قبل أي عرض على "${clip(p.title, 60)}" خلال 30 دقيقة، فتم إلغاء الطلب` }),
    en: (p) => ({ title: 'Request expired', body: `The customer accepted no offer on "${clip(p.title, 60)}" within 30 minutes, so it was cancelled` }),
  },
  noOffers: {
    ar: (p) => ({ title: 'لم نجد حرفياً متاحاً', body: `انتهت مهلة طلب "${clip(p.title, 60)}" بدون عروض وتم إلغاؤه. جرّب مرة أخرى لاحقاً` }),
    en: (p) => ({ title: 'No artisan available', body: `"${clip(p.title, 60)}" got no offers in time and was cancelled. Please try again later` }),
  },
  // Chats are stored encrypted: the notification never carries the text.
  newMessage: {
    ar: (p) => ({ title: p.senderName, body: p.image ? '📷 صورة' : 'رسالة جديدة' }),
    en: (p) => ({ title: p.senderName, body: p.image ? '📷 Photo' : 'New message' }),
  },
  // A message the admin wrote in the dashboard (same text in both languages).
  system: {
    ar: (p) => ({ title: p.title, body: p.body }),
    en: (p) => ({ title: p.title, body: p.body }),
  },
  // A request over the open-request limit was not sent to anyone.
  tooManyOpen: {
    ar: (p) => ({ title: 'لم يُرسل طلبك', body: `"${p.title}" لم يُرسل لأن عندك طلبات مفتوحة كثيرة. انتظر حتى ينتهي أحدها أو ألغِه ثم أعد النشر.` }),
    en: (p) => ({ title: 'Your request was not sent', body: `"${p.title}" wasn't sent because you have too many open requests. Wait for one to finish, or cancel one, then post again.` }),
  },
  // The team decided on the artisan's verification (dashboard).
  verificationApproved: {
    ar: () => ({ title: 'تم توثيق حسابك ✅', body: 'صار حسابك موثّقاً، وبتوصلك من الآن طلبات الزبائن القريبين منك.' }),
    en: () => ({ title: 'Your account is verified ✅', body: 'You now receive requests from customers near you.' }),
  },
  verificationRejected: {
    ar: (p) => ({
      title: 'لم يتم قبول توثيق حسابك',
      body: p.reason ? `السبب: ${clip(p.reason)}. صحّح المطلوب وأرسل المستندات من جديد من صفحة التوثيق.` : 'افتح صفحة التوثيق وأرسل المستندات من جديد.',
    }),
    en: (p) => ({
      title: 'Your verification was not accepted',
      body: p.reason ? `Reason: ${clip(p.reason)}. Fix it and send your documents again from the Verification page.` : 'Open the Verification page and send your documents again.',
    }),
  },
  // The Qareeb team answered in the support chat (the reply, shortened).
  supportReply: {
    ar: (p) => ({ title: 'رد من فريق قريب', body: clip(p.text ?? '') }),
    en: (p) => ({ title: 'Reply from the Qareeb team', body: clip(p.text ?? '') }),
  },
  becameFeatured: {
    ar: (p) => ({ title: 'مبروك! صرت حرفياً مميزاً ⭐', body: `أكملت ${p.jobs} طلبات وتقييمك أعلى من ${p.rating ?? 4}، فصار عندك شارة "حرفي مميز" وتصلك الطلبات الجديدة قبل غيرك.` }),
    en: (p) => ({ title: "Congratulations, you're a featured artisan ⭐", body: `${p.jobs} jobs done and a rating above ${p.rating ?? 4}: you now carry the "Featured" badge and get new requests before others.` }),
  },
};

export function render(type, locale, params) {
  const m = MESSAGES[type];
  return (m[locale] ?? m.ar)(params);
}
