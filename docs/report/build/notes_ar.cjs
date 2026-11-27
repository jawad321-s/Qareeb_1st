// Notes for the team (Arabic): what the team has to add to the Arabic report,
// what needs their confirmation, and what changed from the previous report.
// Usage: node notes_ar.cjs <out.docx>
const fs = require('fs');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, AlignmentType, HeadingLevel, LevelFormat, Footer, PageNumber, TableLayoutType } = D;

const FONT = 'Times New Roman';
const F = { ascii: FONT, hAnsi: FONT, cs: FONT, eastAsia: FONT };
const W = 11906 - 2 * 1000;

function runs(text, base = {}) {
  return String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((part) => {
    if (part.startsWith('**')) return new TextRun({ text: part.slice(2, -2), bold: true, font: F, rightToLeft: true, ...base });
    if (part.startsWith('`')) return new TextRun({ text: '‎' + part.slice(1, -1) + '‎', font: 'Consolas', size: 20 });
    return new TextRun({ text: part, font: F, rightToLeft: true, ...base });
  });
}
const P = (text, o = {}) => new Paragraph({ bidirectional: true, alignment: AlignmentType.LEFT, spacing: { after: 120, line: 300 }, children: runs(text, o.run), ...(o.p || {}) });
const H1 = (text) => new Paragraph({ bidirectional: true, heading: HeadingLevel.HEADING_1, children: runs(text) });
const H2 = (text) => new Paragraph({ bidirectional: true, heading: HeadingLevel.HEADING_2, children: runs(text) });
const B = (items) => items.map((t) => new Paragraph({ bidirectional: true, numbering: { reference: 'b', level: 0 }, alignment: AlignmentType.LEFT, spacing: { after: 60, line: 290 }, children: runs(t) }));

const border = { style: BorderStyle.SINGLE, size: 4, color: '8A94A6' };
const borders = { top: border, bottom: border, left: border, right: border };
function T(head, rows, pct) {
  const widths = pct.map((x) => Math.round((x / 100) * W));
  widths[widths.length - 1] += W - widths.reduce((a, c) => a + c, 0);
  const cell = (t, i, hdr) => new TableCell({
    width: { size: widths[i], type: WidthType.DXA }, borders, margins: { top: 60, bottom: 60, left: 100, right: 100 },
    shading: hdr ? { fill: 'D9E2F3', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    children: (Array.isArray(t) ? t : [t]).map((l) => new Paragraph({ bidirectional: true, alignment: hdr ? AlignmentType.CENTER : AlignmentType.LEFT, spacing: { after: 0, line: 270 }, children: runs(l, { size: 22, ...(hdr ? { bold: true } : {}) }) })),
  });
  return [
    new Table({ visuallyRightToLeft: true, width: { size: W, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, true)) }), ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) }))] }),
    new Paragraph({ children: [], spacing: { after: 160 } }),
  ];
}

const children = [
  new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: runs('ملاحظات للفريق حول تقرير التخرج العربي', { size: 36, bold: true, color: '1F2A44' }) }),
  new Paragraph({ bidirectional: true, alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: runs('مشروع قريب – 27 تشرين الثاني 2026', { size: 24, color: '555555' }) }),

  H1('1. شو اللي تعمل'),
  P('الملف `Qareeb_Graduation_Report_AR.docx` هو تقريركم القديم بالعربي، بعد ما عدّلت فيه كل إشي ما عاد مطابق للمشروع الحالي، وكمّلته لسبع فصول حسب تمبليت الجامعة: المقدمة، تحليل النظام، المتطلبات الوظيفية، التصميم، البرمجة والتنفيذ، الاختبار، والاستنتاجات. حافظت على نصوصكم الأصلية وين ما كانت صحيحة، وعلى شعار الجامعة وشكل الغلاف وإطاره، والترقيم بالأرقام الرومانية للصفحات التمهيدية.'),
  P('كل مكان بدّه معلومة منكم معلّم بطريقتين:'),
  ...B([
    '**نص أصفر بين قوسين** مثل [يكمله الفريق]: امسحوه واكتبوا مكانه المعلومة، وبعدها شيلوا اللون الأصفر (Home ← Text Highlight Color ← No Color).',
    '**مربع بإطار برتقالي متقطع** بصفحة المراجع: اكتبوا جوّاه، أو امسحوا المربع واكتبوا المراجع كقائمة عادية.',
  ]),
  P('بعد ما تخلصوا تعديل: كليك يمين على فهرس المحتويات ← Update Field ← Update entire table، وكرروها لفهرس الأشكال وفهرس الجداول، عشان تتحدّث أرقام الصفحات. وإذا Word سألكم عند الفتح عن تحديث الحقول اضغطوا Yes.'),

  H1('2. أشياء لازم تضيفوها أنتم'),
  P('هدول أشياء ما بقدر أعرفها من الكود ولا من سجل GitHub، فتركت إلهم مكان فاضي بالتقرير. أرقام الصفحات تقريبية (حسب نسخة PDF)، وممكن تتغير شوي بالـ Word.'),
  ...T(['#', 'المطلوب', 'مكانه بالتقرير', 'ملاحظات'], [
    ['1', 'أسماء التطبيقات المشابهة اللي درستوها، مع الخصائص المفيدة ونقاط الضعف لكل واحد', 'الفقرة 1.5.2، جدول (1-1)، صفحة 4 تقريبًا', 'إذا درستوا أقل من 3 تطبيقات امسحوا الصفوف الزايدة'],
    ['2', 'تاريخ نشر الاستبيانين وفترة جمع الإجابات', 'الفقرة 1.5.2، تحت جدول (1-1)، صفحة 4', 'مثال: من 1 إلى 15 آذار 2026'],
    ['3', 'تاريخ بداية خطة المرحلة الأولى (مرحلة المقترح)', 'الفقرة 1.6.1، صفحة 5', 'التاريخ اللي بلّشت فيه المهمة T1'],
    ['4', 'المبالغ الفعلية لـ Firebase ورسائل SMS وreCAPTCHA', 'الفقرة 2.6.1، جدول (2-7)، صفحة 13', 'من Firebase Console ← Usage and billing، ومن Google Cloud Console ← Billing. اكتبوا المبلغ الشهري أو مجموع فترة التجربة'],
    ['5', 'توزيع المهام بين أعضاء الفريق', 'الفقرة 2.8، جدول (2-9)، صفحة 16', 'شو عمل كل واحد: تحليل، تصميم واجهات، اختبار، توثيق، استبيانات...'],
    ['6', 'نتائج تجارب الأجهزة DT-02 وDT-04 وDT-05', 'الفقرة 6.3.4، جدول (6-5)، صفحة 83', 'جرّبوا على iPhone وAndroid واكتبوا شو صار فعلًا، ونوع الجهاز والتاريخ. إذا نجحت اكتبوا بالحالة «ناجح» مع التاريخ'],
    ['7', 'نتائج اختبار القبول مع مستخدمين حقيقيين (إذا عملتوه)', 'الفقرة 6.3.5، جدول (6-6)، صفحة 84', 'إذا ما عملتوه: امسحوا الجدول وخلّوا الجملة اللي بتقول إنه لم يُجرَ'],
    ['8', 'المراجع الأكاديمية (كتب، أبحاث، مشاريع سابقة) ونمط التوثيق اللي بتطلبه الجامعة', 'صفحة المراجع، صفحة 88', 'المراجع الموجودة حاليًا بس التوثيق الرسمي للتقنيات بنمط IEEE'],
  ], [5, 33, 27, 35]),

  H1('3. أشياء بدها تأكيد منكم'),
  P('هدول قرارات أخذتها أنا أثناء التعديل. إذا في إشي مش مزبوط احكولي أو عدّلوه مباشرة بالملف:'),
  ...T(['#', 'شو عملت', 'وين'], [
    ['1', 'زدت «(قريب)» على اسم المشروع بالغلاف: «تطبيق هاتف لإدارة الخدمات القريبة (قريب)»', 'الغلاف'],
    ['2', 'لقب المشرف: بالغلاف القديم كان «د. أمجد الحسيني» وبالشكر «الأستاذ أمجد الحسيني». وحّدته «د.» بالغلاف و«الدكتور» بالشكر', 'الغلاف، شكر وتقدير'],
    ['3', 'شلت من الإهداء جملة «لمدخلٍ يليق بكِ، ولوجهٍ يعكس هويتك وكرامتك» لأنها من مشروع معماري', 'الإهداء'],
    ['4', 'بالشكر: «برؤية تخطيطية، ومعمارية، واقعية، وطموحة» صارت «برؤية واقعية وطموحة»، و«المختصين أو الجهات الرسمية أو المواطنين الذين شاركونا رؤيتهم حول المنطقة» صارت «الزبائن والحرفيون الذين شاركونا آراءهم وأجابوا عن استبيانات المشروع»', 'شكر وتقدير'],
    ['5', 'خلّيت جدول الجدوى الاقتصادية القديم (NPV وROI) زي ما هو، بس كتبت إنه تقديرات من مرحلة المقترح وما انقاس على النظام الفعلي', 'الفقرة 2.6.1'],
    ['6', 'المخططات (UML وERD) بالإنجليزي، عشان الأسماء تطابق الكود. مصادرها قابلة للتعديل بمجلد `docs/report/diagrams`', 'الفصلين 3 و4'],
    ['7', 'كتبت إنه نسخة المتاجر (Development build) «مخطط لها والقرار بانتظار الفريق»', 'الفقرة 7.2'],
    ['8', 'الغلاف فيه الكلية بس بدون اسم القسم أو التخصص، زي التقرير القديم. إذا الجامعة بتطلب القسم ضيفوه', 'الغلاف'],
    ['9', 'السنة الدراسية 2026 – 2027 زي ما كانت', 'الغلاف'],
  ], [5, 70, 25]),

  H1('4. شو تغيّر عن التقرير القديم'),
  ...B([
    '**قاعدة البيانات:** كانت MongoDB وجداول علائقية (Admin وCustomer وService_Request...)، وصارت Cloud Firestore بمجموعاتها الفعلية، ومخطط ERD مكيّف لقاعدة مستندية.',
    '**الخرائط:** كانت Google Maps API، وصارت خدمة الموقع بالجهاز مع OpenStreetMap، وزر الاتجاهات بيفتح تطبيق الخرائط بالموبايل.',
    '**حالات الاستخدام:** 48 جدول قديم بعضها مش موجود بالنظام (البحث عن خدمة، قبول الحرفي للطلب، تحديث السعر التقديري، ممثل الدفع الإلكتروني، المحادثة قبل الاتفاق)، صاروا 40 جدول مطابقين للنظام الحالي، والفروقات موضحة بجدول (3-2).',
    '**الترقيم:** كل الجداول القديمة كانت مرقمة (1-x) حتى لو بفصل ثاني؛ هلأ الترقيم حسب الفصل، والفهارس بتتحدث تلقائيًا.',
    '**نص منسوخ:** خلاصة الفصل الرابع القديمة كانت عن «منصة الرعاية الطبية الافتراضية» (أطباء ومرضى ومختبرات)، فانكتبت من جديد.',
    '**فصول جديدة:** الفصل 5 (البرمجة والتنفيذ، ومعه الدوال السحابية وقواعد الأمان بدل Stored Procedures، والمصادقة، والأمان، والتكامل، والنشر)، والفصل 6 (الاختبار بنتائج حقيقية)، والفصل 7 (الاستنتاجات والأعمال المستقبلية).',
    '**قسم المؤسسة:** «نبذة تاريخية عن المؤسسة» صار «خلفية المشروع والمجال المستهدف» لأنه المشروع مش تابع لمؤسسة.',
    '**رسومات الاستبيان:** الـ 20 رسمة الأصلية نقلتها للملحق (ج)، ولخصت النتائج بجدولين بالفقرة 1.5.2.',
    '**الملخص:** صار في ملخص عربي، والـ Abstract الإنجليزي اتحدّث حسب النظام الحالي.',
  ]),

  H1('5. الاختبارات'),
  P('ما كتبت «ناجح» إلا على الاختبارات اللي شغلتها فعلًا ولها نتيجة: قواعد الأمان 14/14 والدوال السحابية 52/52 (بتاريخ 27/11/2026)، وفحص الأنواع بدون أخطاء، ووصول رمز SMS لرقم Ooredoo على iPhone (25/11/2026). سيناريوهات Playwright مكتوب إنها نجحت أثناء التطوير بس برامجها مش محفوظة بالمستودع. وباقي تجارب الأجهزة واختبار المستخدمين فاضيين لحتى تعبوهم أنتم.'),

  H1('6. ملفات ثانية'),
  ...B([
    '`Qareeb_Graduation_Report_AR.pdf`: نفس التقرير العربي PDF للمعاينة.',
    '`Qareeb_Graduation_Report.docx`: النسخة الإنجليزية اللي عملتها قبل، إذا احتجتوها.',
    'مصادر التقرير العربي بمجلد `docs/report/build/ar`، وطريقة إعادة توليده بملف `README.md`.',
  ]),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: F, size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 30, bold: true, color: '1F2A44', rightToLeft: true }, paragraph: { bidirectional: true, spacing: { before: 280, after: 140 }, keepNext: true, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: F, size: 26, bold: true, color: '2B4C9B', rightToLeft: true }, paragraph: { bidirectional: true, spacing: { before: 200, after: 100 }, keepNext: true, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 560, hanging: 280 } } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: F, size: 20 })] })] }) },
    children,
  }],
});
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(process.argv[2], buf); console.log('written', process.argv[2]); });
