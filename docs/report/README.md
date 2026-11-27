# تقرير مشروع التخرج — قريب

## الملفات
| الملف | المحتوى |
|---|---|
| `Qareeb_Graduation_Report_AR.docx` | **التقرير الرئيسي بالعربي** (112 صفحة، سبع فصول)، قابل للتعديل بـ Word. الفهرس وفهرس الأشكال وفهرس الجداول جاهزين. الأماكن اللي بدها معلومات من الفريق معلّمة بالأصفر. |
| `Qareeb_Graduation_Report_AR.pdf` | نفس التقرير العربي PDF. |
| `feasibility/Qareeb_Feasibility_AR.xlsx` | حاسبة دراسة الجدوى الاقتصادية: عبّوا الخلايا الصفرا بورقة «المدخلات»، والنتائج بتطلع بورقة «جدول الجدوى» (NPV وROI وفترة الاسترداد ونقطة التعادل). |
| `Qareeb_Chapter1_AR.docx` و`Qareeb_Chapter2_AR.docx` و`Qareeb_Chapter3_AR.docx` | الفصول الأول والثاني والثالث معدّلة، كل واحد لحاله. |
| `Qareeb_Report_Notes_AR.docx` | ملاحظات للفريق: شو لازم تضيفوا ووين، وشو بده تأكيد، وشو تغيّر عن التقرير القديم. |
| `Qareeb_Graduation_Report.docx` و`.pdf` | النسخة الإنجليزية من التقرير (95 صفحة). |
| `Qareeb_Documentation_Review_AR.docx` | مذكرة المراجعة الأولى (البنود الستة). |
| `diagrams/` | مصادر المخططات القابلة للتعديل، وجنب كل وحدة صورتها PNG: `.mmd` (Mermaid) و`.puml` (PlantUML). |
| `screens/` | صور حقيقية من التطبيق ولوحة التحكم (على المحاكيات ببيانات تجريبية). |
| `survey/` | رسومات نتائج الاستبيانين، مأخوذة من التقرير القديم. |
| `build/` | السكربتات اللي ولّدت التقارير. |

## تعديل التقرير
**الطريقة الأسهل:** افتح ملف Word وعدّل عليه مباشرة.
- النص الأصفر بين قوسين، مثل [يكمله الفريق]، امسحه واكتب مكانه المعلومة، وبعدين شيل اللون الأصفر.
- إذا Word سألك عن تحديث الحقول (Update fields)، اضغط **Yes**.
- بعد أي تعديل كبير: كليك يمين على الفهرس، بعدين **Update Field**، بعدين **Update entire table**. كرّرها لفهرس الأشكال وفهرس الجداول.

## إعادة التوليد من المصدر (اختياري)
بيحتاج مكتبة `docx` من npm، وLibreOffice لحساب أرقام صفحات الفهارس.

**التقرير العربي:**
1. المحتوى بمجلد `build/ar/`: `front.cjs` (الغلاف والإهداء والشكر والملخص)، `ch1.cjs` لحد `ch7.cjs`، و`back.cjs` (المراجع والملاحق).
2. شغّل:
   ```
   cd docs/report/build
   node build_ar.cjs ../out.docx
   python3 update_indexes.py ../out.docx ../out-lo.docx ../out-lo.pdf
   python3 fill_toc_ar.py ../out-lo.docx ../out.docx ../Qareeb_Graduation_Report_AR.docx
   ```
3. ملف الملاحظات: `node notes_ar.cjs ../Qareeb_Report_Notes_AR.docx`
4. فصل لحاله: `AR_BODY_ONLY=1 AR_CH=ch2 node build_ar.cjs ../Qareeb_Chapter2_AR.docx`
5. حاسبة الجدوى: `python3 feasibility_xlsx.py ../feasibility/Qareeb_Feasibility_AR.xlsx` (بتحتاج openpyxl)

**التقرير الإنجليزي:** المحتوى بملفات `build/front.cjs` و`build/ch1.cjs` لحد `build/ch7.cjs`، والتوليد بـ `build.cjs` ثم `update_indexes.py` ثم `fill_toc.py` بنفس الطريقة.

**المخططات:**
- **Mermaid:** `node render.cjs ../diagrams`، وبيحتاج `mermaid@11.4.1` و`playwright` بنفس المجلد.
- **PlantUML:** `java -jar plantuml.jar -tpng -Sdpi=200 ../diagrams/*.puml`، وبيحتاج Graphviz.

## مصدر المعلومات
كل المعلومات مأخوذة من الكود الحالي ومن تاريخ Git (190 تعديل، 16 تموز لحد 27 تشرين الثاني 2026).

أرقام الاختبارات من تشغيلها فعلياً بتاريخ 27 تشرين الثاني 2026:
- قواعد الأمان: 14/14.
- الدوال السحابية: 52/52.
- فحص الأنواع: بدون أخطاء.

نتائج الاستبيان مأخوذة من التقرير السابق. دراسة الجدوى الاقتصادية القديمة انشالت لأنها منسوخة من مشروع ثاني وفيها أخطاء حساب، وحلّت محلها الحاسبة.
