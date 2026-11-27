// Arabic review notes that accompany the English report (items 1-6 of the request).
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, HeadingLevel, LevelFormat, Footer, PageNumber } = require('docx');

const F = 'Arial';
const W = 10466;
const r = (text, o = {}) => new TextRun({ text, rightToLeft: true, font: { ascii: F, hAnsi: F, cs: F }, size: o.size || 24, bold: o.bold, ...(o.bold ? { boldComplexScript: true } : {}) });
const runs = (t, size) => t.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) => (s.startsWith('**') ? r(s.slice(2, -2), { bold: true, size }) : r(s, { size })));
const P = (t, o = {}) => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 120, line: 300 }, children: runs(t, o.size), ...o.p });
const H1 = (t) => new Paragraph({ bidirectional: true, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT, children: [r(t, { bold: true, size: 32 })], spacing: { before: 360, after: 160 } });
const H2 = (t) => new Paragraph({ bidirectional: true, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.RIGHT, children: [r(t, { bold: true, size: 26 })], spacing: { before: 240, after: 100 } });
let inst = 0;
const L = (items, numbered) => { const i = ++inst; return items.map((t) => new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, numbering: { reference: numbered ? 'num' : 'bul', level: 0, instance: numbered ? i : undefined }, spacing: { after: 60, line: 288 }, children: runs(t) })); };
const b = { style: BorderStyle.SINGLE, size: 4, color: '8A94A6' };
const borders = { top: b, bottom: b, left: b, right: b };
function T(head, rows, widths) {
  const ws = widths.map((w) => Math.round((w / 100) * W));
  ws[ws.length - 1] += W - ws.reduce((a, c) => a + c, 0);
  const cell = (t, i, h) => new TableCell({ width: { size: ws[i], type: WidthType.DXA }, borders, margins: { top: 50, bottom: 50, left: 90, right: 90 }, shading: h ? { fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto' } : undefined, children: [new Paragraph({ bidirectional: true, alignment: AlignmentType.RIGHT, spacing: { after: 0, line: 252 }, children: runs(t, 20).map((x) => x) })] });
  return [new Table({ visuallyRightToLeft: true, width: { size: W, type: WidthType.DXA }, columnWidths: ws, rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell('**' + h + '**', i, true)) }), ...rows.map((row) => new TableRow({ cantSplit: true, children: row.map((t, i) => cell(t, i)) }))] }), new Paragraph({ children: [], spacing: { after: 120 } })];
}

const content = [
  new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [r('مذكرة مراجعة توثيق مشروع التخرج: قريب', { bold: true, size: 36 })] }),
  new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [r('ترافق التقرير الإنجليزي Qareeb_Graduation_Report.docx — 27 تشرين الثاني 2026', { size: 22 })] }),
  P('هذه المذكرة تجمع المخرجات الستة المطلوبة قبل التقرير: فهم المشروع، آخر التحديثات، التعديلات على التوثيق السابق، مقارنة أقسام التمبليت بالأقسام المعدّلة، الفهرس المحدّث، والمعلومات الناقصة. مصدر الحقيقة في كل ما يلي هو الكود الحالي في المستودع، ونتائج الاختبارات التي أعيد تشغيلها اليوم.'),
  P('**ملاحظة مهمة:** الملف المرفق "Graduation project template" هو تقريركم العربي السابق (فيه أسماء الفريق والمشرف ونتائج الاستبيان ودراسة التكاليف)، فتمّت مراجعته كتوثيق سابق، واعتُمدت بنيته وتنسيق غلافه وشعار الجامعة في التقرير الجديد.'),

  H1('1. ملخص فهم المشروع وآلية عمله'),
  P('قريب نظام إلكتروني لإدارة الخدمات المنزلية القريبة، يتكوّن من ثلاثة أجزاء على نفس الخلفية السحابية (Firebase):'),
  ...L([
    '**تطبيق جوّال واحد** (React Native + Expo SDK 58) للزبون والحرفي؛ الواجهة تتغيّر حسب نوع الحساب، والرقم الواحد يحمل حساب زبون وحساب حرفي منفصلين.',
    '**لوحة تحكم ويب** (Next.js 15) لمدير النظام، منشورة على Firebase Hosting، بالعربية والإنجليزية.',
    '**خلفية Firebase:** Authentication وCloud Firestore وCloud Storage و16 دالة سحابية في europe-west1، مع قواعد أمان على كل قراءة وكتابة.',
  ]),
  P('**آلية العمل:** ينشر الزبون طلبًا (خدمة، وصف، صور، موقع) ← دالة سحابية ترسله للحرفيين الموثّقين المتاحين بنفس الفئة وضمن ساعات عملهم داخل 2 كم، وتوسّع الدائرة 2 كم كل دقيقتين حتى 12 كم ما دام لا يوجد عرض، والحرفي المميز يصله قبل غيره بدرجة ← يقدّم الحرفيون عروضًا (سعر ووقت وصول ورسالة) ما دام اشتراكهم فعّالًا ← يقارن الزبون ويقبل عرضًا (فتُغلق باقي العروض ويُبلَّغ أصحابها) أو يرفض مع السبب؛ وبعد 30 دقيقة بلا قبول يُلغى الطلب ويمكن إعادة نشره ← تُفتح محادثة مشفّرة بين الطرفين ← الحرفي: في الطريق ← قيد التنفيذ (يمكن تعديل السعر) ← مكتمل، أو يكتمل تلقائيًا بعد 48 ساعة ← تقييم متبادل إلزامي. ويستطيع أي طرف الإلغاء قبل بدء العمل مع السبب، وتقديم شكوى، واقتراح خدمة، ومحادثة الدعم.'),
  P('**مدير النظام:** يراجع وثائق التوثيق ويقبل أو يرفض مع السبب، ويوقف الحسابات أو يعيد تفعيلها ويوثّقها (لا حذف من اللوحة)، ويدير الفئات والخدمات، والشكاوى، والاقتراحات، والدعم، وإشعارات النظام، وأسعار الاشتراكات (تجربة 7 أيام ثم 3 أو 6 أو 12 شهرًا بأسعار افتراضية 129 و239 و449 شيكل، والدفع محاكاة)، والإعدادات، والتحليلات.'),

  H1('2. آخر التحديثات المكتشفة'),
  P('من تاريخ المستودع (190 تعديلًا بين 16 تموز و27 تشرين الثاني 2026)، أحدث ما أُضيف:'),
  ...L([
    'وصول رموز SMS لأرقام جوال وأوريدو عبر reCAPTCHA Enterprise SMS defense (25 تشرين الثاني)، مع إعادة المحاولة بصيغة +972.',
    'فصل سجل الطلبات **المرفوضة** عن **الملغاة** عند الزبون والحرفي، وتنبيه باقي الحرفيين واختفاء الطلب من قوائمهم عند قبول عرض غيرهم (26 تشرين الثاني).',
    'محادثة مشفّرة (XSalsa20-Poly1305) مع صور متعددة وكاميرا ورد وحذف للجميع؛ محادثة الدعم مع الفريق تعمل حتى للحسابات الموقوفة.',
    'أسباب الإلغاء والرفض تصل للطرف الآخر؛ إعادة نشر الطلب المنتهي؛ حد 10 طلبات مفتوحة؛ الحرفي المميز (10 أعمال وتقييم فوق 4).',
    'إدارة المستخدمين من اللوحة (إيقاف بكلمة مرور المدير، إعادة تفعيل، توثيق)، وحذف الحساب الذاتي (Soft delete)، وقواعد أمان تقفل خطوات الطلب.',
    'إشعارات النظام وأسعار الاشتراكات من اللوحة، وزر الاتجاهات في تطبيق الخرائط، ونسخ احتياطي يومي وأسبوعي.',
    'أُعيد تشغيل الاختبارات اليوم: قواعد الأمان 14/14، الدوال السحابية 52/52، وفحص الأنواع بلا أخطاء في التطبيق واللوحة.',
  ]),

  H1('3. التعديلات المطلوبة على التوثيق السابق'),
  ...T(['في التقرير السابق', 'الوضع الفعلي الآن', 'ما تم في التقرير الجديد'], [
    ['قاعدة البيانات MongoDB', 'Cloud Firestore (NoSQL) على Firebase', 'وصف Firestore في 5.3 وجداول المجموعات في 4.5'],
    ['Google Maps API لخدمات الموقع', 'موقع الجهاز + OpenStreetMap Nominatim للعنوان + تطبيق الخرائط للاتجاهات', 'مُحدّث في 2.3 و5.8'],
    ['جداول علائقية (Admin, Customer, Artisan, Service_Request, Request_Offer, Chat, ...)', 'مجموعات users, publicProfiles, artisanProfiles, requests, offers, ...', 'استُبدلت بـ 4 مخططات ER ملائمة لـ Firestore وجداول حقول'],
    ['ممثل "نظام الدفع الإلكتروني"', 'الدفع محاكاة فقط', 'حُذف من مخططات Use Case، وأُشير له كعمل مستقبلي'],
    ['البحث عن خدمة حسب النوع أو الموقع، وعرض الحرفيين المرتبطين بالخدمة', 'تصفّح الفئات، والتوزيع التلقائي على أقرب الحرفيين', 'حُذفت ووُضّحت في جدول المتطلبات المتغيّرة (Table 3.2)'],
    ['الحرفي يقبل/يرفض طلب الخدمة ويحدد سعرًا تقديريًا', 'الحرفي يقدّم عرضًا أو يسحبه، والزبون يقبل أو يرفض؛ تعديل السعر فقط أثناء التنفيذ', 'حالات استخدام جديدة UC-06, UC-07, UC-19, UC-20'],
    ['محادثة قبل الاتفاق، وخريطة لموقع الحرفي داخل التطبيق', 'المحادثة بعد القبول فقط؛ لا خريطة داخلية ولا تتبّع مباشر', 'مُحدّث، والتتبّع المباشر في الأعمال المستقبلية'],
    ['المدير يفعّل/يعطّل حساب الزبون، ويدخل برقم الهاتف', 'إيقاف/إعادة تفعيل أي حساب، توثيق/إلغاء توثيق، دخول بالبريد وكلمة المرور مع صلاحية admin', 'UC-23, UC-25'],
    ['"إدارة الإعلانات" و"عرض تقييمات المستخدمين"', 'إشعارات النظام لجمهور محدد؛ التقييمات تظهر مع كل حساب في قائمة المستخدمين', 'UC-30 وجدول المتطلبات المتغيّرة'],
    ['خلاصة الفصل الرابع تتحدث عن "منصة الرعاية الطبية الافتراضية" وجداول الأطباء والمرضى', 'نص منسوخ من مشروع آخر', 'حُذف بالكامل'],
    ['في الإهداء "لمدخلٍ يليق بكِ"، وفي الشكر "رؤية تخطيطية ومعمارية" و"المواطنين الذين شاركونا رؤيتهم حول المنطقة"', 'عبارات من مشروع معماري', 'عُدّلت في النسخة الإنجليزية، تحتاج تأكيدكم'],
    ['ترقيم كل الجداول (1-x) حتى في الفصل الرابع، وعنوان مكرر "دراسة الجدوى الاقتصادية" بدل القانونية', 'أخطاء تنسيق', 'ترقيم حسب الفصل (Table 3.5…) وعناوين صحيحة'],
    ['واجهات التطبيق تصاميم أولية', 'التطبيق ولوحة التحكم مبنيّان فعلًا', 'صور حقيقية من التطبيق واللوحة (4.7)'],
    ['الجدوى التقنية تتحدث عن خوادم لاستضافة قاعدة البيانات', 'معمارية Serverless على Firebase', 'مُحدّث في 2.6.2'],
    ['دراسة الجدوى الاقتصادية (NPV 27,960$، ROI 486%)', 'تقديرات مرحلة المقترح وليست قيمًا مقاسة؛ بند "إعداد قاعدة البيانات 500$" لا يطابق Firestore', 'نُقلت كما هي مع توضيح أنها تقديرات، وأُضيف جدول بنود التكلفة الفعلية'],
    ['المنهجية: مراحل مخطّطة (تسجيل، ثم مراسلة وخرائط، ثم تقييم، ثم اختبار)', 'خمس زيادات فعلية بتواريخ من Git', 'أُضيف جدول الزيادات الفعلية ومخطط Gantt'],
  ], [32, 34, 34]),

  H1('4. أقسام التمبليت والأقسام المعدّلة'),
  ...T(['قسم التمبليت', 'في التقرير الجديد', 'السبب'], [
    ['الغلاف، الإهداء، الشكر، الملخص، الفهارس', 'نفس الترتيب والتنسيق مع شعار الجامعة وإطار الصفحة؛ أُضيفت List of Abbreviations', 'المصطلحات التقنية كثيرة'],
    ['صفحة "شعار مقترح"', 'نُقل الشعار إلى 4.7 (Figure 4.24)', 'ليست من الصفحات التمهيدية المطلوبة'],
    ['1.1 – 1.8', 'كما هي؛ "فكرة المشروع" دُمجت في 1.1، و"طرق جمع البيانات" صارت 1.5.2 مع نتائج الاستبيان', 'مطابقة الهيكل المطلوب'],
    ['2.2 A Brief History of the Organization', '2.2 Project Background and Target Domain', 'المشروع غير تابع لمؤسسة'],
    ['2.6 دراسة الجدوى (4 أنواع)', 'Economic, Technical, Legal, Schedule', 'كما في الهيكل المطلوب؛ الجدولة القديمة انتقلت إلى 1.6 و2.6.4'],
    ['3.2 Context or Use-Case Diagrams', 'مخطط سياق + 4 مخططات Use Case (لكل ممثل)', 'مخطط واحد كان غير مقروء'],
    ['3.3 Functional Requirements Description', 'جدول 61 متطلبًا مع الحالة + 40 جدول وصف حالة استخدام + جدول المتطلبات المتغيّرة', 'التمييز بين المنفّذ والمحدود والمستقبلي'],
    ['4.2 Class Diagram ... 4.7 Summary', 'أُضيف 4.2 System Architecture، فصار Class 4.3، Sequence 4.4، ERD 4.5، Activity 4.6، Interface 4.7، Summary 4.8', 'المعمارية ضرورية لفهم نظام سحابي'],
    ['4.4 ER-Model', 'ER مكيّف لـ Firestore (مجموعات ووثائق ومجموعات فرعية) + جداول الحقول', 'قاعدة البيانات غير علائقية'],
    ['4.5 Activity Diagrams', '5 مخططات نشاط بمسارات (Swimlanes) + مخطط حالات الطلب', 'دورة الطلب تعتمد على الحالات'],
    ['5.5 Stored Procedures', 'Server-Side Processing: Cloud Functions and Security Rules', 'لا توجد Stored Procedures في Firebase'],
    ['(غير موجود)', '5.6 Authentication and Authorization، 5.7 Security and Privacy، 5.8 External Integrations، 5.9 Deployment', 'أقسام جوهرية في هذا المشروع'],
    ['6.1 – 6.5', 'كما هي، مع جداول Test Case (ID, Scenario, Expected, Actual, Status)', 'لا يُسجّل Passed إلا بنتيجة فعلية'],
    ['7.1 – 7.3', 'كما هي، مع جدول تحقيق الأهداف وجدول الأعمال المستقبلية بحالاتها', ''],
    ['(غير موجود)', 'References + Appendix A (أنواع الإشعارات) + Appendix B (52 اختبارًا) + Appendix C (ملفات المخططات)', 'التوثيق والتتبّع'],
  ], [28, 44, 28]),

  H1('5. الفهرس المحدّث (Table of Contents)'),
  ...L([
    'Preliminary: Cover, Dedication, Acknowledgments, Abstract, Table of Contents, List of Figures, List of Tables, List of Abbreviations',
    'Chapter 1 Introduction: 1.1 Introduction · 1.2 Problem Statement · 1.3 Project Objectives · 1.4 Project Benefits (1.4.1–1.4.4) · 1.5 Project Methodology (1.5.1 Development Model, 1.5.2 Data Collection) · 1.6 Research Plan (1.6.1 Proposal-Phase Plan, 1.6.2 Actual Increments) · 1.7 Project Constraints · 1.8 Summary and Recommendations',
    'Chapter 2 System Analysis: 2.1 Introduction · 2.2 Project Background and Target Domain · 2.3 Implementation Options · 2.4 The Proposed System · 2.5 System Requirements · 2.6 Feasibility Study (2.6.1 Economic, 2.6.2 Technical, 2.6.3 Legal, 2.6.4 Schedule) · 2.7 Added Values · 2.8 Project Management · 2.9 Summary',
    'Chapter 3 Functional Requirements: 3.1 Introduction · 3.2 Context and Use-Case Diagrams · 3.3 Functional Requirements (3.3.1 Table, 3.3.2 Use-Case Descriptions UC-01..UC-40) · 3.4 Non-Functional Requirements · 3.5 Summary',
    'Chapter 4 Design: 4.1 Introduction · 4.2 System Architecture · 4.3 Class Diagrams · 4.4 Sequence Diagrams · 4.5 ER Diagram (Data Model) · 4.6 Activity and State Diagrams · 4.7 System Interface · 4.8 Summary',
    'Chapter 5 Implementation: 5.1 Introduction · 5.2 Languages and Frameworks · 5.3 Database System · 5.4 Development Environment · 5.5 Server-Side Processing · 5.6 Authentication and Authorization · 5.7 Security and Privacy · 5.8 External Integrations · 5.9 Deployment · 5.10 Summary',
    'Chapter 6 Testing: 6.1 Introduction · 6.2 Testing Plan · 6.3 Integration Test (Rules, Functions, End-to-End, Device) · 6.4 Results · 6.5 Summary',
    'Chapter 7: 7.1 Conclusions · 7.2 Future Works · 7.3 Closing Remarks · References · Appendices A–C',
  ]),

  H1('6. المعلومات الناقصة التي تحتاج تأكيدكم'),
  ...L([
    '**اسم المشروع بالإنجليزي:** استخدمتُ ترجمة اسم الغلاف "Qareeb: A Mobile Application for Managing Nearby Services". هل نعتمده، أم "An Electronic System for Managing Nearby Services" (لأن النظام يشمل لوحة ويب)؟',
    '**تهجئة الأسماء بالإنجليزي:** Jawad Fawarah، Mayyas Banat، Dania Al-Julani، Rama Zama\'rah، Dr. Amjad Al-Husseini — صحّحوها كما تُكتب رسميًا.',
    '**لقب المشرف:** الغلاف "د." والشكر "الأستاذ"؛ اعتمدتُ Dr.',
    '**اسم القسم** إذا كان مطلوبًا على الغلاف، والتأكد أن السنة 2026–2027 صحيحة.',
    '**توزيع المهام** بين أعضاء الفريق (القسم 2.8)؛ الخطة القديمة نسبت كل مرحلة للجميع.',
    '**تواريخ المرحلة الأولى:** تاريخ بداية خطة الـ27 أسبوعًا وتاريخ تنفيذ الاستبيان.',
    '**أسماء التطبيقات المشابهة** التي درستموها، لإضافتها في 1.5.2 والمقارنة.',
    '**التكاليف الفعلية:** فاتورة Firebase والرسائل وreCAPTCHA، وهل نُبقي جدول الجدوى الاقتصادية القديم كتقدير أم نستبدله.',
    '**نتائج تجارب الأجهزة** DT-02 (Push على iPhone)، DT-04 (الكاميرا)، DT-05 (الموقع على iOS وAndroid)، وهل أُجري اختبار مع مستخدمين حقيقيين.',
    '**المراجع الأكاديمية** التي استخدمتموها ونمط التوثيق المطلوب من الجامعة (القائمة الحالية وثائق رسمية للتقنيات فقط).',
    '**الإهداء والشكر:** تأكيد الصياغة الإنجليزية والعبارات التي عُدّلت (البند 11 في القسم 3).',
    '**قرار نسخة التطوير (Development build)** لإشعارات أندرويد، لأنه يغيّر حالة DT-03 والأعمال المستقبلية.',
  ], true),
  P('بعد وصول هذه المعلومات تُحدّث القيم في ملف واحد (src/front.cjs للغلاف والإهداء والشكر) ويُعاد توليد التقرير، أو تُعدّل مباشرة في ملف Word.'),
];

const doc = new Document({
  styles: { default: { document: { run: { font: F, size: 24 } } }, paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font: F, size: 32, bold: true, color: '1F2A44' }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: F, size: 26, bold: true, color: '1F2A44' }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, outlineLevel: 1 } },
  ] },
  numbering: { config: [
    { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { right: 540, hanging: 270 } } } }] },
    { reference: 'num', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.RIGHT, style: { paragraph: { indent: { right: 540, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20 })] })] }) },
    children: content,
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(process.argv[2], buf); console.log('written', process.argv[2]); });
