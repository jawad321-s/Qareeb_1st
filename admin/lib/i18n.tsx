'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Locale = 'ar' | 'en';

// ── Dictionary ───────────────────────────────────────────────────────────────
const dict = {
  en: {
    // sidebar / nav
    'app.name': 'Qareeb',
    'app.console': 'Admin console',
    'nav.overview': 'Overview',
    'nav.users': 'Users',
    'nav.verifications': 'Verifications',
    'nav.requests': 'Requests',
    'nav.analytics': 'Analytics',
    'nav.categories': 'Categories',
    'nav.complaints': 'Complaints',
    'nav.subscriptions': 'Subscriptions',
    'nav.settings': 'Settings',
    'sidebar.help': 'Need help?',
    'sidebar.helpDesc': 'Check the docs or contact support.',
    // topbar
    'topbar.search': 'Search users, requests, artisans…',
    'topbar.admin': 'Admin',
    'topbar.superAdmin': 'Super admin',
    // common
    'common.search': 'Search…',
    'common.page': 'Page',
    'common.of': 'of',
    'common.rows': 'rows',
    'common.prev': 'Prev',
    'common.next': 'Next',
    'common.noResults': 'No results found.',
    'common.view': 'View',
    // status
    'status.active': 'active',
    'status.suspended': 'suspended',
    'status.pending': 'pending',
    'status.approved': 'approved',
    'status.rejected': 'rejected',
    'status.open': 'open',
    'status.reviewing': 'reviewing',
    'status.resolved': 'resolved',
    'status.PENDING': 'pending',
    'status.ACCEPTED': 'accepted',
    'status.ON_THE_WAY': 'on the way',
    'status.WORKING': 'in progress',
    'status.COMPLETED': 'completed',
    'status.CANCELLED': 'cancelled',
    // overview
    'ov.title': 'Overview',
    'ov.welcome': "Welcome back — here's what's happening on Qareeb today.",
    'ov.totalRevenue': 'Total revenue',
    'ov.vsLastMonth': 'vs last month',
    'ov.totalUsers': 'Total users',
    'ov.activeArtisans': 'Active artisans',
    'ov.totalRequests': 'Total requests',
    'ov.revenue': 'Revenue',
    'ov.monthlyGross': 'Monthly gross revenue',
    'ov.byCategory': 'Requests by category',
    'ov.distribution': 'Distribution across services',
    'ov.recentActivity': 'Recent activity',
    'ov.pendingVerifications': 'Pending verifications',
    // users
    'users.title': 'Users',
    'users.subtitle': 'total accounts — customers and artisans.',
    'users.search': 'Search users…',
    'col.user': 'User',
    'col.role': 'Role',
    'col.city': 'City',
    'col.rating': 'Rating',
    'col.jobs': 'Jobs',
    'col.verified': 'Verified',
    'col.status': 'Status',
    'col.joined': 'Joined',
    'role.customer': 'customer',
    'role.artisan': 'artisan',
    // verifications
    'ver.title': 'Verification queue',
    'ver.subtitle': 'artisans awaiting identity review.',
    'ver.pending': 'pending',
    'ver.approve': 'Approve',
    'ver.reject': 'Reject',
    'ver.submitted': 'submitted',
    'ver.idFront': 'ID front',
    'ver.idBack': 'ID back',
    'ver.certificate': 'Certificate',
    // requests
    'req.title': 'Requests',
    'req.subtitle': 'All service requests across the platform.',
    'req.search': 'Search requests…',
    'rcol.id': 'ID',
    'rcol.request': 'Request',
    'rcol.customer': 'Customer',
    'rcol.category': 'Category',
    'rcol.offers': 'Offers',
    'rcol.budget': 'Budget',
    'rcol.created': 'Created',
    'req.needed': 'service needed',
    // analytics
    'an.title': 'Analytics',
    'an.subtitle': 'Revenue, demand and category insights.',
    'an.revenueTrend': 'Revenue trend',
    'an.requestsVolume': 'Requests volume',
    'an.categoryShare': 'Category share',
    'an.statusBreakdown': 'Request status breakdown',
    'an.pending': 'Pending',
    'an.active': 'Active',
    'an.completed': 'Completed',
    'an.cancelled': 'Cancelled',
    // categories
    'cat.title': 'Categories',
    'cat.subtitle': 'service categories in the catalog.',
    'cat.new': 'New category',
    'cat.services': 'services',
    'cat.active': 'Active',
    'cat.hidden': 'Hidden',
    // complaints
    'comp.title': 'Complaints',
    'comp.subtitle': 'Disputes and reports submitted by users.',
    'comp.view': 'View',
    'comp.resolve': 'Resolve',
    'comp.resolved': 'Resolved',
    'comp.reported': 'reported',
    // subscriptions
    'sub.title': 'Subscriptions',
    'sub.subtitle': 'Artisan plan distribution and recurring revenue.',
    'sub.mrr': 'Monthly recurring revenue',
    'sub.subs': 'subs',
    'sub.month': 'month',
    // settings
    'set.title': 'Settings',
    'set.subtitle': 'Platform configuration and team access.',
    'set.platform': 'Platform',
    'set.platformName': 'Platform name',
    'set.supportEmail': 'Support email',
    'set.currency': 'Default currency',
    'set.commission': 'Commission rate',
    'set.save': 'Save changes',
    'set.roles': 'Roles & permissions',
    'set.members': 'members',
    // login
    'login.console': 'Admin console',
    'login.tagline': 'Manage users, verify artisans, monitor requests and track revenue — all in one enterprise dashboard.',
    'login.copyright': '© 2026 Qareeb. All rights reserved.',
    'login.welcomeBack': 'Welcome back',
    'login.subtitle': 'Sign in to the Qareeb admin console.',
    'login.email': 'admin@qareeb.app',
    'login.signIn': 'Sign in',
    'login.rbac': 'Protected by role-based access control.',
  },
  ar: {
    'app.name': 'قريب',
    'app.console': 'لوحة الإدارة',
    'nav.overview': 'نظرة عامة',
    'nav.users': 'المستخدمون',
    'nav.verifications': 'طلبات التوثيق',
    'nav.requests': 'الطلبات',
    'nav.analytics': 'التحليلات',
    'nav.categories': 'الفئات',
    'nav.complaints': 'الشكاوى',
    'nav.subscriptions': 'الاشتراكات',
    'nav.settings': 'الإعدادات',
    'sidebar.help': 'تحتاج مساعدة؟',
    'sidebar.helpDesc': 'راجع الوثائق أو تواصل مع الدعم.',
    'topbar.search': 'ابحث عن مستخدمين، طلبات، حرفيين…',
    'topbar.admin': 'المسؤول',
    'topbar.superAdmin': 'مسؤول عام',
    'common.search': 'بحث…',
    'common.page': 'صفحة',
    'common.of': 'من',
    'common.rows': 'صف',
    'common.prev': 'السابق',
    'common.next': 'التالي',
    'common.noResults': 'لا توجد نتائج.',
    'common.view': 'عرض',
    'status.active': 'نشط',
    'status.suspended': 'موقوف',
    'status.pending': 'قيد الانتظار',
    'status.approved': 'مقبول',
    'status.rejected': 'مرفوض',
    'status.open': 'مفتوح',
    'status.reviewing': 'قيد المراجعة',
    'status.resolved': 'محلول',
    'status.PENDING': 'قيد الانتظار',
    'status.ACCEPTED': 'مقبول',
    'status.ON_THE_WAY': 'في الطريق',
    'status.WORKING': 'قيد التنفيذ',
    'status.COMPLETED': 'مكتمل',
    'status.CANCELLED': 'ملغى',
    'ov.title': 'نظرة عامة',
    'ov.welcome': 'أهلاً بعودتك — هذا ما يحدث في قريب اليوم.',
    'ov.totalRevenue': 'إجمالي الإيرادات',
    'ov.vsLastMonth': 'مقارنة بالشهر الماضي',
    'ov.totalUsers': 'إجمالي المستخدمين',
    'ov.activeArtisans': 'الحرفيون النشطون',
    'ov.totalRequests': 'إجمالي الطلبات',
    'ov.revenue': 'الإيرادات',
    'ov.monthlyGross': 'الإيراد الشهري الإجمالي',
    'ov.byCategory': 'الطلبات حسب الفئة',
    'ov.distribution': 'التوزيع على الخدمات',
    'ov.recentActivity': 'النشاط الأخير',
    'ov.pendingVerifications': 'طلبات التوثيق المعلّقة',
    'users.title': 'المستخدمون',
    'users.subtitle': 'إجمالي الحسابات — عملاء وحرفيون.',
    'users.search': 'ابحث عن مستخدمين…',
    'col.user': 'المستخدم',
    'col.role': 'الدور',
    'col.city': 'المدينة',
    'col.rating': 'التقييم',
    'col.jobs': 'الأعمال',
    'col.verified': 'موثّق',
    'col.status': 'الحالة',
    'col.joined': 'الانضمام',
    'role.customer': 'عميل',
    'role.artisan': 'حرفي',
    'ver.title': 'طابور التوثيق',
    'ver.subtitle': 'حرفيون بانتظار مراجعة الهوية.',
    'ver.pending': 'معلّق',
    'ver.approve': 'قبول',
    'ver.reject': 'رفض',
    'ver.submitted': 'أُرسل',
    'ver.idFront': 'الهوية (أمام)',
    'ver.idBack': 'الهوية (خلف)',
    'ver.certificate': 'الشهادة',
    'req.title': 'الطلبات',
    'req.subtitle': 'جميع طلبات الخدمة عبر المنصّة.',
    'req.search': 'ابحث عن طلبات…',
    'rcol.id': 'المعرّف',
    'rcol.request': 'الطلب',
    'rcol.customer': 'العميل',
    'rcol.category': 'الفئة',
    'rcol.offers': 'العروض',
    'rcol.budget': 'الميزانية',
    'rcol.created': 'التاريخ',
    'req.needed': 'خدمة مطلوبة',
    'an.title': 'التحليلات',
    'an.subtitle': 'رؤى عن الإيرادات والطلب والفئات.',
    'an.revenueTrend': 'اتجاه الإيرادات',
    'an.requestsVolume': 'حجم الطلبات',
    'an.categoryShare': 'حصص الفئات',
    'an.statusBreakdown': 'توزيع حالات الطلبات',
    'an.pending': 'قيد الانتظار',
    'an.active': 'نشطة',
    'an.completed': 'مكتملة',
    'an.cancelled': 'ملغاة',
    'cat.title': 'الفئات',
    'cat.subtitle': 'فئة خدمة في الكتالوج.',
    'cat.new': 'فئة جديدة',
    'cat.services': 'خدمات',
    'cat.active': 'نشطة',
    'cat.hidden': 'مخفية',
    'comp.title': 'الشكاوى',
    'comp.subtitle': 'النزاعات والبلاغات المقدّمة من المستخدمين.',
    'comp.view': 'عرض',
    'comp.resolve': 'حلّ',
    'comp.resolved': 'محلولة',
    'comp.reported': 'أبلغ عن',
    'sub.title': 'الاشتراكات',
    'sub.subtitle': 'توزيع باقات الحرفيين والإيراد المتكرّر.',
    'sub.mrr': 'الإيراد الشهري المتكرّر',
    'sub.subs': 'مشترك',
    'sub.month': 'شهر',
    'set.title': 'الإعدادات',
    'set.subtitle': 'إعدادات المنصّة وصلاحيات الفريق.',
    'set.platform': 'المنصّة',
    'set.platformName': 'اسم المنصّة',
    'set.supportEmail': 'بريد الدعم',
    'set.currency': 'العملة الافتراضية',
    'set.commission': 'نسبة العمولة',
    'set.save': 'حفظ التغييرات',
    'set.roles': 'الأدوار والصلاحيات',
    'set.members': 'عضو',
    'login.console': 'لوحة الإدارة',
    'login.tagline': 'أدر المستخدمين، وثّق الحرفيين، راقب الطلبات وتتبّع الإيرادات — كل ذلك في لوحة واحدة.',
    'login.copyright': '© 2026 قريب. جميع الحقوق محفوظة.',
    'login.welcomeBack': 'أهلاً بعودتك',
    'login.subtitle': 'سجّل الدخول إلى لوحة إدارة قريب.',
    'login.email': 'admin@qareeb.app',
    'login.signIn': 'تسجيل الدخول',
    'login.rbac': 'محميّة بنظام صلاحيات حسب الدور.',
  },
} as const;

export type TKey = keyof (typeof dict)['en'];

interface Ctx {
  locale: Locale;
  t: (k: TKey) => string;
  setLocale: (l: Locale) => void;
  toggle: () => void;
  isRTL: boolean;
}

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const saved = (localStorage.getItem('qareeb.admin.locale') as Locale) || 'ar';
    setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = (l: Locale) => {
    localStorage.setItem('qareeb.admin.locale', l);
    setLocaleState(l);
  };

  const value: Ctx = {
    locale,
    t: (k) => dict[locale][k] ?? dict.en[k] ?? k,
    setLocale,
    toggle: () => setLocale(locale === 'ar' ? 'en' : 'ar'),
    isRTL: locale === 'ar',
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useT must be used within LocaleProvider');
  return ctx;
}
