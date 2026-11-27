# Builds the economic-feasibility calculator for the Qareeb report (Arabic, right to left).
# Usage: python3 feasibility_xlsx.py <out.xlsx>
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.comments import Comment

out = sys.argv[1]
FONT = 'Arial'
BLUE = Font(name=FONT, color='0000FF')
BLACK = Font(name=FONT, color='000000')
GREEN = Font(name=FONT, color='008000')
BOLD = Font(name=FONT, bold=True)
TITLE = Font(name=FONT, bold=True, size=14, color='1F2A44')
HEAD = Font(name=FONT, bold=True, color='1F2A44')
YELLOW = PatternFill('solid', fgColor='FFFF00')
HEADFILL = PatternFill('solid', fgColor='D9E2F3')
SECTION = PatternFill('solid', fgColor='EEF3FC')
thin = Side(style='thin', color='8A94A6')
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
NUM = '#,##0;(#,##0);"-"'
NUM2 = '#,##0.00;(#,##0.00);"-"'
PCT = '0.0%;(0.0%);"-"'
R = Alignment(horizontal='right', vertical='center', wrap_text=True)
C = Alignment(horizontal='center', vertical='center', wrap_text=True)

wb = Workbook()

# ── legend ──
lg = wb.active
lg.title = 'دليل'
lg.sheet_view.rightToLeft = True
lg.column_dimensions['A'].width = 3
lg.column_dimensions['B'].width = 110
rows = [
    ('حاسبة دراسة الجدوى الاقتصادية لنظام قريب', TITLE),
    ('', None),
    ('شو بتعمل: بتحسب الإيرادات والتكاليف وصافي القيمة الحالية (NPV) والعائد على الاستثمار (ROI) وفترة الاسترداد وعدد المشتركين اللازم لتغطية التكاليف، على مدى سنة الاستثمار (السنة 0) وخمس سنوات تشغيل.', None),
    ('', None),
    ('الألوان:', BOLD),
    ('• خلية صفراء: مدخل لازم تعبّوه أنتم (بورقة "المدخلات" فقط).', None),
    ('• رقم أزرق: معلومة ثابتة معروفة (مثل أسعار الخطط من كود التطبيق)، ومكتوب مصدرها بتعليق على الخلية.', None),
    ('• رقم أسود: معادلة، لا تعدّلوها. النتائج بورقة "جدول الجدوى"، بنفس ترتيب جدولكم القديم: الفوائد، ثم التكاليف التطويرية، ثم التشغيلية، ثم المؤشرات.', None),
    ('• رقم أخضر: قيمة منقولة من ورقة ثانية.', None),
    ('', None),
    ('طريقة الكتابة:', BOLD),
    ('• النسب تنكتب ككسر عشري: 0.25 يعني 25%.', None),
    ('• المبالغ بالشيكل إلا إذا كان مكتوب دولار. عدد المشتركين رقم صحيح، مثل 40.', None),
    ('• الخلية اللي ما بتنطبق عليكم اكتبوا فيها 0، وما تتركوها فاضية.', None),
    ('', None),
    ('أسس الحساب:', BOLD),
    ('• الدراسة من وجهة نظر المنصة: الإيراد الوحيد هو اشتراكات الحرفيين، لأنه الزبون بيستخدم التطبيق مجانًا. فوائد الزبائن والحرفيين (توفير الوقت، زيادة الشغل) فوائد غير ملموسة وما بتنحسب كإيراد.', None),
    ('• تكاليف التطوير بالسنة 0 (قبل التشغيل) وما بتنخصم. تكاليف التشغيل والإيرادات من السنة 1 لحد 5 وبتنخصم بمعدل الخصم.', None),
    ('• صافي القيمة الحالية = مجموع (صافي التدفق ÷ (1 + معدل الخصم) ^ رقم السنة) من السنة 0 لحد 5.', None),
    ('• العائد على الاستثمار = صافي القيمة الحالية ÷ القيمة الحالية لكل التكاليف.', None),
    ('• فترة الاسترداد = أول سنة بيصير فيها التدفق التراكمي المخصوم صفر أو أكثر.', None),
    ('• إيراد المشترك بالسنة = حسب توزيع الخطط: خطة 3 أشهر × 4 مرات، خطة 6 أشهر × مرتين، خطة سنة × مرة، مطروح منه عمولة بوابة الدفع.', None),
    ('', None),
    ('ملاحظة: الدفع حاليًا محاكى بالتطبيق، فالإيرادات بتفترض ربط بوابة دفع حقيقية.', None),
]
for i, (t, f) in enumerate(rows, start=1):
    c = lg.cell(row=i, column=2, value=t)
    c.alignment = R
    if f: c.font = f
    else: c.font = Font(name=FONT)

# ── inputs ──
ws = wb.create_sheet('المدخلات')
ws.sheet_view.rightToLeft = True
for col, w in zip('ABCDEFGHI', [3, 46, 14, 14, 14, 14, 14, 3, 60]):
    ws.column_dimensions[col].width = w
ws['B1'] = 'مدخلات دراسة الجدوى'; ws['B1'].font = TITLE

def label(r, text, bold=False):
    c = ws.cell(row=r, column=2, value=text); c.alignment = R; c.font = BOLD if bold else Font(name=FONT); return c
def section(r, text):
    for col in range(2, 8):
        ws.cell(row=r, column=col).fill = SECTION
    c = label(r, text, True); c.font = HEAD
def inp(ref, value=None, fmt=NUM, note=None, fact=False):
    c = ws[ref]; c.value = value; c.number_format = fmt; c.border = BOX; c.alignment = C
    c.font = BLUE if (fact or value is not None) else BLUE
    if not fact: c.fill = YELLOW
    if note: c.comment = Comment(note, 'Qareeb')
def explain(r, text):
    c = ws.cell(row=r, column=9, value=text); c.alignment = R; c.font = Font(name=FONT, italic=True, color='555555')

section(3, 'أولًا: معلومات عامة')
label(4, 'معدل الخصم السنوي'); inp('C4', 0.10, PCT, 'من دراسة الفريق السابقة (10%). غيّروه إذا المشرف طلب معدل آخر.'); explain(4, 'اختيار الفريق، بيتغيّر حسب المشرف')
label(5, 'سعر صرف الدولار بالشيكل'); inp('C5', None, NUM2); explain(5, 'لتحويل رسوم المتاجر من دولار لشيكل')
label(6, 'عمولة بوابة الدفع (نسبة من الإيراد)'); inp('C6', None, PCT); explain(6, 'حسب البوابة اللي رح تستخدموها')

section(8, 'ثانيًا: أسعار الخطط (من التطبيق)')
for c_, t in zip('CDE', ['السعر (₪)', 'المدة (أشهر)', 'مرات الدفع بالسنة']):
    h = ws[f'{c_}8']; h.value = t; h.font = HEAD; h.alignment = C; h.fill = SECTION
plans = [(9, 'خطة 3 أشهر', 129, 3), (10, 'خطة 6 أشهر', 239, 6), (11, 'خطة سنة', 449, 12)]
for r, name, price, months in plans:
    label(r, name)
    inp(f'C{r}', price, NUM, 'السعر الافتراضي بالتطبيق: mobile/src/lib/plans.ts. مدير النظام بيقدر يغيّره من لوحة التحكم.', fact=True)
    inp(f'D{r}', months, NUM, 'مدة الخطة بالتطبيق: mobile/src/lib/plans.ts', fact=True)
    e = ws[f'E{r}']; e.value = f'=12/D{r}'; e.number_format = NUM; e.font = BLACK; e.border = BOX; e.alignment = C
explain(9, 'الفترة التجريبية المجانية (7 أيام) ما إلها إيراد')

section(13, 'ثالثًا: توزيع المشتركين على الخطط')
label(14, 'نسبة المشتركين بخطة 3 أشهر'); inp('C14', None, PCT)
label(15, 'نسبة المشتركين بخطة 6 أشهر'); inp('C15', None, PCT)
label(16, 'نسبة المشتركين بخطة سنة'); inp('C16', None, PCT)
label(17, 'المجموع (لازم يكون 100%)', True)
s = ws['C17']; s.value = '=SUM(C14:C16)'; s.number_format = PCT; s.font = BLACK; s.border = BOX; s.alignment = C
explain(17, 'إذا المجموع مش 100% الحساب بيطلع غلط')

section(19, 'رابعًا: عدد الحرفيين المشتركين')
for i, c_ in enumerate('CDEFG', start=1):
    h = ws[f'{c_}19']; h.value = f'السنة {i}'; h.font = HEAD; h.alignment = C; h.fill = SECTION
label(20, 'متوسط عدد المشتركين بالسنة')
for c_ in 'CDEFG':
    inp(f'{c_}20', None, NUM)
explain(20, 'توقّعكم، ويُفضّل يكون مبني على عدد الحرفيين بالخليل ونتيجة الاستبيان')

section(22, 'خامسًا: تكاليف التطوير (السنة 0، لمرة واحدة)')
label(23, 'عدد أعضاء الفريق'); inp('C23', 4, NUM, 'عدد أعضاء فريق المشروع', fact=True)
label(24, 'ساعات العمل لكل عضو'); inp('C24', None, NUM)
label(25, 'تكلفة ساعة العمل (₪)'); inp('C25', None, NUM); explain(25, 'اكتبوا 0 إذا ما بدكم تحسبوا تعب الفريق، بس الأفضل تحطوا قيمة')
label(26, 'أجهزة وبرامج (₪)'); inp('C26', None, NUM); explain(26, '0 إذا استخدمتوا أجهزتكم وبرامج مجانية')
label(27, 'رسوم Google Play لمرة واحدة ($)'); inp('C27', 25, NUM, 'رسوم التسجيل في Google Play Console (لمرة واحدة) حسب موقع Google. تأكدوا منها قبل الاعتماد.', fact=True); explain(27, 'بتلزم بس إذا رح تنشروا على Google Play، وإلا اكتبوا 0')
label(28, 'تكاليف أخرى لمرة واحدة (₪)'); inp('C28', None, NUM)

section(30, 'سادسًا: تكاليف التشغيل السنوية')
for i, c_ in enumerate('CDEFG', start=1):
    h = ws[f'{c_}30']; h.value = f'السنة {i}'; h.font = HEAD; h.alignment = C; h.fill = SECTION
oprows = [
    (31, 'Firebase: الفاتورة السنوية (₪)', None, 'من Firebase Console ← Usage and billing'),
    (32, 'رسائل SMS: عدد الرسائل بالسنة', None, 'تقريبًا: عدد التسجيلات + طلبات استعادة كلمة المرور'),
    (33, 'رسائل SMS: سعر الرسالة (₪)', None, 'من صفحة أسعار Firebase Phone Auth لفلسطين'),
    (34, 'reCAPTCHA Enterprise (₪ بالسنة)', None, 'من فاتورة Google Cloud، غالبًا صغيرة'),
    (35, 'Apple Developer Program ($ بالسنة)', 99, 'الرسوم السنوية لبرنامج Apple Developer حسب موقع Apple. تأكدوا منها قبل الاعتماد، واكتبوا 0 إذا ما رح تنشروا على App Store.'),
    (36, 'صيانة ودعم فني (₪ بالسنة)', None, 'ساعات الصيانة × تكلفة الساعة'),
    (37, 'تكاليف تشغيل أخرى (₪ بالسنة)', None, 'مثل التسويق أو دومين خاص'),
]
for r, name, val, note in oprows:
    label(r, name)
    for c_ in 'CDEFG':
        inp(f'{c_}{r}', val, NUM2 if r == 33 else NUM, note if val is not None and c_ == 'C' else None, fact=val is not None)
    explain(r, note)

# ── feasibility table (same layout as the team's study: years as columns, benefits then costs) ──
cs = wb.create_sheet('جدول الجدوى')
cs.sheet_view.rightToLeft = True
for col, w in zip('ABCDEFGH', [52, 15, 13, 13, 13, 13, 13, 15]):
    cs.column_dimensions[col].width = w
I = "'المدخلات'!"
YC = 'BCDEFG'          # year 0 .. year 5
INY = dict(zip('CDEFG', 'CDEFG'))  # input year columns map 1:1 (input C = year 1)
hdr = ['البند', 'السنة 0 (قبل التشغيل)', 'السنة 1', 'السنة 2', 'السنة 3', 'السنة 4', 'السنة 5', 'المجموع']
for i, t in enumerate(hdr):
    c = cs.cell(row=1, column=i + 1, value=t); c.font = HEAD; c.fill = HEADFILL; c.border = BOX; c.alignment = C

def line(r, name, cells, fmt=NUM, total=True, bold=False, green=False):
    c = cs.cell(row=r, column=1, value=name); c.alignment = R; c.border = BOX; c.font = BOLD if bold else Font(name=FONT)
    for col, f in zip(YC, cells):
        x = cs[f'{col}{r}']; x.value = f; x.number_format = fmt; x.border = BOX; x.alignment = C
        x.font = Font(name=FONT, bold=bold, color='008000' if green else '000000')
    t = cs[f'H{r}']; t.border = BOX; t.alignment = C
    if total:
        t.value = f'=SUM(B{r}:G{r})'; t.number_format = fmt; t.font = Font(name=FONT, bold=True)

def head(r, text):
    for col in range(1, 9):
        cs.cell(row=r, column=col).fill = SECTION; cs.cell(row=r, column=col).border = BOX
    c = cs.cell(row=r, column=1, value=text); c.font = HEAD; c.alignment = R

y = 'CDEFG'  # years 1..5 in this sheet
head(2, 'الفوائد (Benefits): إيرادات اشتراكات الحرفيين')
for r, name, mix, price, times in [(3, 'اشتراكات خطة 3 أشهر', 'C14', 'C9', 'E9'), (4, 'اشتراكات خطة 6 أشهر', 'C15', 'C10', 'E10'), (5, 'اشتراكات خطة سنة', 'C16', 'C11', 'E11')]:
    line(r, name, ['=0'] + [f'={I}{k}20*{I}${mix[0]}${mix[1:]}*{I}${price[0]}${price[1:]}*{I}${times[0]}${times[1:]}' for k in y])
line(6, 'عمولة بوابة الدفع (تُطرح)', ['=0'] + [f'=-SUM({k}3:{k}5)*{I}$C$6' for k in y])
line(7, 'Total Benefits (صافي الإيرادات)', [f'=SUM({k}3:{k}6)' for k in YC], bold=True)
line(8, 'PV of Benefits (القيمة الحالية للإيرادات)', [f'={k}7*{k}34' for k in YC])

head(9, 'التكاليف التطويرية (Development Costs)')
line(10, 'جهد فريق التطوير', [f'={I}C23*{I}C24*{I}C25'] + ['=0'] * 5)
line(11, 'الأجهزة والبرامج', [f'={I}C26'] + ['=0'] * 5, green=True)
line(12, 'رسوم Google Play Console (لمرة واحدة)', [f'={I}C27*{I}C5'] + ['=0'] * 5)
line(13, 'تكاليف أخرى لمرة واحدة', [f'={I}C28'] + ['=0'] * 5, green=True)
line(14, 'Total development costs', [f'=SUM({k}10:{k}13)' for k in YC], bold=True)

head(15, 'التكاليف التشغيلية (Operational Costs)')
line(16, 'Firebase (قاعدة البيانات والدوال والتخزين والاستضافة)', ['=0'] + [f'={I}{k}31' for k in y], green=True)
line(17, 'رسائل SMS للتحقق', ['=0'] + [f'={I}{k}32*{I}{k}33' for k in y])
line(18, 'reCAPTCHA Enterprise', ['=0'] + [f'={I}{k}34' for k in y], green=True)
line(19, 'Apple Developer Program', ['=0'] + [f'={I}{k}35*{I}$C$5' for k in y])
line(20, 'الصيانة والدعم الفني', ['=0'] + [f'={I}{k}36' for k in y], green=True)
line(21, 'تكاليف تشغيل أخرى', ['=0'] + [f'={I}{k}37' for k in y], green=True)
line(22, 'Total Operational costs', [f'=SUM({k}16:{k}21)' for k in YC], bold=True)

head(23, 'النتائج')
line(24, 'Total Costs (التطويرية + التشغيلية)', [f'={k}14+{k}22' for k in YC], bold=True)
line(25, 'PV of Total Costs (القيمة الحالية للتكاليف)', [f'={k}24*{k}34' for k in YC])
line(26, 'Net Total = Total Benefits − Total Costs', [f'={k}7-{k}24' for k in YC], bold=True)
line(27, 'PV of Net Total (القيمة الحالية لصافي التدفق)', [f'={k}26*{k}34' for k in YC])
line(28, 'Cumulative PV (التدفق التراكمي المخصوم)', ['=B27'] + [f'={p}28+{k}27' for p, k in zip('BCDEF', 'CDEFG')], total=False)
line(29, 'Break-Even: عدد المشتركين اللازم لتغطية تكاليف التشغيل', ['=0'] + [f'=IF($B$33>0,ROUNDUP({k}22/$B$33,0),0)' for k in y], total=False)

def result(r, name, f, fmt):
    c = cs.cell(row=r, column=1, value=name); c.font = BOLD; c.alignment = R; c.border = BOX; c.fill = SECTION
    x = cs[f'B{r}']; x.value = f; x.number_format = fmt; x.font = Font(name=FONT, bold=True); x.border = BOX; x.alignment = C
result(30, 'صافي القيمة الحالية (NPV)', '=SUM(B27:G27)', NUM)
result(31, 'العائد على الاستثمار (ROI) = NPV ÷ PV of Total Costs', '=IF(H25>0,B30/H25,0)', PCT)
result(32, 'فترة الاسترداد (رقم السنة)', '=IF(H24=0,"-",IFERROR(MATCH(1,B35:G35,0)-1,"أكثر من 5 سنوات"))', '0')
result(33, 'صافي إيراد المشترك الواحد في السنة', f'=({I}C14*{I}C9*{I}E9+{I}C15*{I}C10*{I}E10+{I}C16*{I}C11*{I}E11)*(1-{I}C6)', NUM2)
line(34, 'معامل الخصم (Discount Rate من المدخلات)', [f'=1/(1+{I}$C$4)^{i}' for i in range(6)], fmt='0.0000', total=False)
line(35, 'مساعد: هل غطّى التدفق التراكمي التكاليف؟ (1 = نعم)', [f'=IF({k}28>=0,1,0)' for k in YC], fmt='0', total=False)
c = cs.cell(row=36, column=1, value='النتيجة'); c.font = BOLD; c.alignment = R; c.border = BOX; c.fill = SECTION
x = cs['B36']; x.value = '=IF(H24=0,"عبّوا المدخلات بورقة المدخلات",IF(B30>0,"المشروع مجدٍ اقتصاديًا (NPV موجب)","المشروع غير مجدٍ بهذه المدخلات (NPV سالب)"))'
x.font = Font(name=FONT, bold=True); x.alignment = R; x.border = BOX
cs.merge_cells('B36:H36')
notes = [
    'الفوائد غير الملموسة (ما بتنحسب كإيراد): توفير وقت الزبون، زيادة شغل الحرفيين، شفافية الأسعار، جودة أعلى من خلال التقييم والتوثيق، تنظيم السوق المحلي.',
    'تحقّقوا قبل ما تنقلوا الأرقام للتقرير: مجموع نسب الخطط بورقة المدخلات (C17) لازم يكون 100%.',
]
for i, t in enumerate(notes):
    c = cs.cell(row=38 + i, column=1, value=t); c.font = Font(name=FONT, italic=True, color='555555' if i == 0 else '9C0006'); c.alignment = R
    cs.merge_cells(f'A{38 + i}:H{38 + i}')
cs.row_dimensions[38].height = 30

for sh in wb.worksheets:
    sh.page_setup.orientation = 'landscape'
    sh.page_setup.paperSize = sh.PAPERSIZE_A4
    sh.sheet_properties.pageSetUpPr.fitToPage = True
    sh.page_setup.fitToWidth = 1
    sh.page_setup.fitToHeight = 0
wb.active = wb.sheetnames.index('المدخلات')
wb.save(out)
print('written', out)
