// Sample notifications for the demo (no backend): one feed per role.
import type { FeedItem } from '@/hooks/useNotificationFeed';

// Role-specific feeds: customers get updates about THEIR requests (offers in,
// booking confirmed, review prompt); artisans get updates about THEIR work
// (nearby jobs, offer accepted, new rating, weekly income).
export const customerNotifs = (tint: string): Record<'en' | 'ar', FeedItem[]> => ({
  en: [
    { id: 'c1', icon: 'wallet', color: tint, title: 'New offer received', body: 'Omar Khalid offered 120 ₪ for your plumbing request.', ts: Date.now() - 12 * 60_000, read: false, route: '/(shared)/request/req_1' },
    { id: 'c2', icon: 'check-circle', color: '#10B981', title: 'Offer accepted', body: 'Your AC repair is confirmed with Tariq Mansour.', ts: Date.now() - 2 * 3600_000, read: false, route: '/(shared)/request/req_2' },
    { id: 'c3', icon: 'message', color: tint, title: 'New message', body: 'Tariq: Please keep the AC off until I arrive.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'c4', icon: 'star', color: '#F59E0B', title: 'Rate your artisan', body: 'How was your deep-clean service? Leave a review.', ts: Date.now() - 4 * 24 * 3600_000, read: true, route: '/(shared)/request/req_3' },
  ],
  ar: [
    { id: 'c1', icon: 'wallet', color: tint, title: 'عرض جديد', body: 'قدّم عمر خالد عرضاً بـ 120 ₪ لطلب السباكة.', ts: Date.now() - 12 * 60_000, read: false, route: '/(shared)/request/req_1' },
    { id: 'c2', icon: 'check-circle', color: '#10B981', title: 'تم قبول العرض', body: 'تم تأكيد إصلاح التكييف مع طارق منصور.', ts: Date.now() - 2 * 3600_000, read: false, route: '/(shared)/request/req_2' },
    { id: 'c3', icon: 'message', color: tint, title: 'رسالة جديدة', body: 'طارق: من فضلك أبقِ التكييف مطفأً حتى أصل.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'c4', icon: 'star', color: '#F59E0B', title: 'قيّم الحرفي', body: 'كيف كانت خدمة التنظيف؟ اترك تقييماً.', ts: Date.now() - 4 * 24 * 3600_000, read: true, route: '/(shared)/request/req_3' },
  ],
});

export const artisanNotifs = (tint: string): Record<'en' | 'ar', FeedItem[]> => ({
  en: [
    { id: 'a1', icon: 'briefcase', color: tint, title: 'New job near you', body: 'Kitchen sink leak in Al-Masyoun, 2.4 km away — budget 80–200 ₪.', ts: Date.now() - 8 * 60_000, read: false, route: '/(artisan)/job/req_1' },
    { id: 'a2', icon: 'check-circle', color: '#10B981', title: 'Your offer was accepted', body: 'Layla Khaled accepted your 150 ₪ offer for the AC repair.', ts: Date.now() - 90 * 60_000, read: false, route: '/(artisan)/job/req_2' },
    { id: 'a3', icon: 'message', color: tint, title: 'New message from customer', body: 'Layla: The building entrance code is 4512.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'a4', icon: 'star', color: '#F59E0B', title: 'New 5-star review', body: '"Fast and clean work, highly recommended" — Ahmad S.', ts: Date.now() - 26 * 3600_000, read: true },
    { id: 'a5', icon: 'trending-up', color: '#10B981', title: 'Weekly income summary', body: 'You earned 940 ₪ from 6 completed jobs this week.', ts: Date.now() - 3 * 24 * 3600_000, read: true, route: '/(artisan)/income' },
  ],
  ar: [
    { id: 'a1', icon: 'briefcase', color: tint, title: 'عمل جديد قريب منك', body: 'تسريب في مغسلة المطبخ بالماصيون، يبعد 2.4 كم — الميزانية 80–200 ₪.', ts: Date.now() - 8 * 60_000, read: false, route: '/(artisan)/job/req_1' },
    { id: 'a2', icon: 'check-circle', color: '#10B981', title: 'تم قبول عرضك', body: 'قبلت ليلى خالد عرضك 150 ₪ لإصلاح التكييف.', ts: Date.now() - 90 * 60_000, read: false, route: '/(artisan)/job/req_2' },
    { id: 'a3', icon: 'message', color: tint, title: 'رسالة جديدة من الزبون', body: 'ليلى: رمز مدخل البناية 4512.', ts: Date.now() - 3 * 3600_000, read: true, route: '/(shared)/chat/req_2' },
    { id: 'a4', icon: 'star', color: '#F59E0B', title: 'تقييم جديد 5 نجوم', body: '"شغل سريع ونظيف، أنصح فيه" — أحمد س.', ts: Date.now() - 26 * 3600_000, read: true },
    { id: 'a5', icon: 'trending-up', color: '#10B981', title: 'ملخص دخل الأسبوع', body: 'حقّقت 940 ₪ من 6 أعمال مكتملة هذا الأسبوع.', ts: Date.now() - 3 * 24 * 3600_000, read: true, route: '/(artisan)/income' },
  ],
});
