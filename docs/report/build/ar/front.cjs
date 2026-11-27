// الغلاف والصفحات التمهيدية. النصوص مأخوذة من التقرير السابق مع التعديلات المذكورة في ملف الملاحظات.
const COVER = {
  college: 'كلية تكنولوجيا المعلومات',
  doc: 'توثيق مشروع التخرج',
  titleLabel: 'اسم المشروع:',
  title: 'تطبيق هاتف لإدارة الخدمات القريبة (قريب)',
  teamLabel: 'فريق العمل:',
  team: ['جواد فوارعة', 'مياس بنات', 'دانية الجولاني', 'راما زماعرة'],
  supLabel: 'بإشراف:',
  supervisor: 'د. أمجد الحسيني',
  year: '2026 – 2027',
};

const dedication = {
  basmala: 'بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ',
  verse: '﴿يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ﴾ [سورة المجادلة: 11]',
  paras: [
    ['', 'إلى من زرعوا فينا الأمل، ومهّدوا لنا طريق العلم بحبٍّ وصبرٍ لا ينفد...'],
    ['إلى أمهاتنا الحنونات:', 'نبض الرحمة الدائم، ودعاؤكنّ الذي ظلّ يرافقنا في كل خطوة، في كل امتحان، وفي كل سهرٍ طويل. كنتنّ النور الذي نجا به القلب من اليأس، والدفء الذي أزهرت به عزائمنا رغم التعب.'],
    ['إلى آبائنا العظماء:', 'من حملوا همّنا بصمت، ومنحونا القوة رغم ما بهم من تعب. شكرًا لثقتكم بنا، ولصبركم علينا، ولأنكم كنتم وما زلتم مصدر إلهامنا الأول.'],
    ['إلى إخوتنا وأخواتنا:', 'شركاء الدرب الذين خفّفوا عنا الضغوط، وفرحوا لفرحنا، واحتضنونا عند الانكسار.'],
    ['إلى أرواح الشهداء وأسرى فلسطين الأحرار:', 'أنتم من علّمتمونا أن الانتماء ليس كلمات، بل فعل وصبر وتضحية. دماؤكم الطاهرة ستظل السراج الذي نستلهم منه حب الأرض والعطاء لها.'],
    ['إلى الخليل... مدينتنا التي نحلم بها أجمل:', 'لكِ هذا المشروع، وهذا الجهد، وهذه الرؤية.'],
    ['وأخيرًا...', 'إلى كل من آمن بنا ودفعنا للأمام حين كادت أرجلنا أن تتباطأ، نهديكم هذا العمل، ثمرة تعبنا ونتيجة سنوات من العلم والحلم.'],
  ],
};

const acknowledgments = {
  verse: 'قال تعالى: ﴿وَقُلِ اعْمَلُوا فَسَيَرَى اللَّهُ عَمَلَكُمْ وَرَسُولُهُ وَالْمُؤْمِنُونَ﴾ [سورة التوبة: 105]',
  paras: [
    'انطلاقًا من عرفاننا بالجميل، وامتناننا لكل من ساندنا في رحلتنا الأكاديمية، نتقدم بخالص الشكر والتقدير لكل من ساهم في مسيرتنا العلمية، وكان جزءًا من إنجاز هذا المشروع.',
    'نتوجه بجزيل الشكر والامتنان لأساتذتنا الكرام في كلية تكنولوجيا المعلومات في جامعة الخليل، الذين لم يبخلوا علينا بعلمهم وتوجيهاتهم وملاحظاتهم القيّمة طوال سنوات دراستنا.',
    'كما نخص بالشكر والعرفان الدكتور أمجد الحسيني المشرف على المشروع، الذي كانت ملاحظاته وإشرافه الدقيق دافعًا لنا نحو تطوير الفكرة وصياغتها برؤية واقعية وطموحة.',
    'ولا ننسى أن نشكر كل من فتح لنا أبواب المعرفة والمعلومة، ومنهم الزبائن والحرفيون الذين شاركونا آراءهم وأجابوا عن استبيانات المشروع.',
    'وإلى كل من مدّ لنا يد العون، من قريب أو بعيد، ولو بكلمة تشجيع واحدة... نقول لكم: شكرًا من القلب، فلكم في هذا المشروع أثرٌ لا يُنسى.',
  ],
};

const logo = {
  title: 'شعار التطبيق',
  text: 'تم اقتراح أكثر من شعار ضمن جهود فريق المشروع، واتُّخذ القرار بشأن الشعار بناءً على عدة معايير، بحيث يعكس الهوية البصرية للمشروع وأهدافه بشكل عام. يرمز الشعار إلى تطبيق هاتف مختص بالخدمات المنزلية من أعمال وصيانة بشكل عصري وحديث، إذ يدمج حرف القاف من اسم «قريب» مع مفتاح الربط. وقد اعتُمد هذا الشعار فعليًا في تطبيق الهاتف وفي لوحة تحكم مدير النظام.',
  caption: 'شعار تطبيق قريب بنسختيه على الخلفية الفاتحة والداكنة',
};

const abstractAr = [
  'ما يزال الوصول إلى حرفي قريب وموثوق لأعمال الصيانة المنزلية يعتمد في الغالب على المعارف الشخصية، وهي طريقة بطيئة لا تتيح مقارنة الأسعار ولا تقدم معلومات كافية عن موثوقية الحرفي. وقد أكّد استبيان أجاب عنه 75 زبونًا و14 حرفيًا هذه المشكلة، إذ يحصل 77.3% من الزبائن على الخدمات المنزلية عن طريق الأصدقاء أو العائلة، وذكر 64.3% من الحرفيين قلة الطلبات بوصفها من أبرز التحديات التي يواجهونها.',
  'يقدم هذا المشروع نظام «قريب»، وهو نظام إلكتروني لإدارة الخدمات المنزلية القريبة يتكون من تطبيق هاتف واحد متعدد المنصات للزبائن والحرفيين مبني باستخدام React Native وExpo، ولوحة تحكم ويب لمدير النظام مبنية باستخدام Next.js، وخادم خلفي على منصة Firebase (المصادقة، وقاعدة بيانات Cloud Firestore، والتخزين السحابي، وست عشرة دالة سحابية). يُنشئ الزبون طلبًا يتضمن وصف المشكلة وصورًا توضيحية وموقعه، فيرسل النظام الطلب تلقائيًا إلى الحرفيين الموثّقين والمتاحين من التخصص نفسه ضمن دائرة نصف قطرها 2 كم، ويوسّع البحث بمقدار 2 كم كل دقيقتين حتى 12 كم. يرد الحرفيون بعروض أسعار، فيقبل الزبون أحدها ويتابع العمل عبر حالات واضحة ويتواصل مع الحرفي من خلال محادثة مشفّرة، ثم يقيّم كل طرف الآخر. أما مدير النظام فيراجع وثائق هوية الحرفيين ويدير الحسابات وقائمة الخدمات والشكاوى ومحادثات الدعم وإشعارات النظام وأسعار الاشتراكات.',
  'طُوّر النظام وفق النموذج التراكمي على خمس زيادات بين تموز وتشرين الثاني 2026. ويُفرض التحكم في الوصول إلى البيانات من خلال قواعد أمان على الخادم، وتُخزّن رسائل المحادثة مشفّرة بخوارزمية XSalsa20-Poly1305، وتصل رموز التحقق النصية إلى شبكات الهاتف الفلسطينية بفضل الحماية التي يوفرها reCAPTCHA Enterprise. وقد نجحت جميع الاختبارات الآلية البالغ عددها 66 اختبارًا (14 اختبارًا لقواعد الأمان و52 اختبارًا للدوال السحابية). أما الخطوات المتبقية قبل الإطلاق العام فهي إصدار نسخة للمتاجر تدعم الإشعارات الفورية الكاملة على أندرويد، وربط بوابة دفع حقيقية، وإجراء دراسة قابلية استخدام مع مستخدمين حقيقيين.',
];
const keywordsAr = 'الكلمات المفتاحية: الخدمات المنزلية، الإرسال حسب الموقع، تطبيقات الهاتف، React Native، Firebase، الدوال السحابية، قواعد الأمان.';

const abstractEn = [
  'Finding a nearby and trustworthy artisan for home maintenance still depends mostly on personal contacts, which is slow, gives no way to compare prices and says little about the artisan\'s reliability. A questionnaire answered by 75 customers and 14 artisans confirmed these problems: 77.3% of the customers obtain home services through friends or family, and 64.3% of the artisans named the small number of requests as a main challenge.',
  'This project presents Qareeb, an electronic system for managing nearby home services. It consists of a single cross-platform mobile application for customers and artisans, built with React Native and Expo, a web dashboard for the system administrator, built with Next.js, and a Firebase back end (Authentication, Cloud Firestore, Cloud Storage and sixteen Cloud Functions). A customer posts a request with a description, photos and location; the system dispatches it automatically to verified, available artisans of the same specialty within 2 km, widening the search by 2 km every 2 minutes up to 12 km. Artisans reply with price offers, the customer accepts one, follows the job through clear statuses and chats with the artisan through an encrypted chat, and both sides rate each other. The administrator verifies artisans\' identity documents and manages accounts, the service catalog, complaints, support conversations, system notifications and subscription prices.',
  'The system was developed with the incremental model in five increments between July and November 2026. Access to data is enforced by server-side security rules, chat messages are encrypted with XSalsa20-Poly1305, and SMS verification codes reach Palestinian mobile networks through reCAPTCHA Enterprise SMS defense. All 66 automated tests (14 security-rules tests and 52 Cloud Functions tests) passed. The remaining steps toward a public launch are a store build with full Android push notifications, a real payment gateway and a usability study with real users.',
];
const keywordsEn = 'Keywords: home services, location-based dispatch, mobile application, React Native, Firebase, Cloud Functions, security rules.';

const abbreviations = [
  ['API', 'Application Programming Interface', 'واجهة برمجة التطبيقات'],
  ['APNs', 'Apple Push Notification service', 'خدمة الإشعارات الفورية من Apple'],
  ['CLI', 'Command-Line Interface', 'واجهة سطر الأوامر'],
  ['E2E', 'End-to-End (test)', 'اختبار شامل من طرف إلى طرف'],
  ['EAS', 'Expo Application Services', 'خدمات Expo لبناء التطبيقات ونشرها'],
  ['ERD', 'Entity Relationship Diagram', 'مخطط الكيانات والعلاقات'],
  ['FCM', 'Firebase Cloud Messaging', 'خدمة الرسائل السحابية من Firebase'],
  ['FR', 'Functional Requirement', 'متطلب وظيفي'],
  ['GPS', 'Global Positioning System', 'نظام تحديد المواقع العالمي'],
  ['NFR', 'Non-Functional Requirement', 'متطلب غير وظيفي'],
  ['NoSQL', 'Not only SQL', 'قاعدة بيانات غير علائقية'],
  ['NPV', 'Net Present Value', 'صافي القيمة الحالية'],
  ['ROI', 'Return on Investment', 'العائد على الاستثمار'],
  ['RTL', 'Right to Left', 'الكتابة من اليمين إلى اليسار'],
  ['SDK', 'Software Development Kit', 'حزمة تطوير البرمجيات'],
  ['SMS', 'Short Message Service', 'خدمة الرسائل النصية القصيرة'],
  ['UC', 'Use Case', 'حالة استخدام'],
  ['UI / UX', 'User Interface / User Experience', 'واجهة المستخدم / تجربة المستخدم'],
  ['UML', 'Unified Modeling Language', 'لغة النمذجة الموحدة'],
];

module.exports = { COVER, dedication, acknowledgments, logo, abstractAr, keywordsAr, abstractEn, keywordsEn, abbreviations };
