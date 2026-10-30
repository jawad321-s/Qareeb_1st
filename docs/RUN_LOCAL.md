# تنزيل مشروع قريب وتشغيله على جهازك لأول مرة 🚀

دليل خطوة بخطوة لأي حدا بالفريق: تنزيل المشروع، تشغيل التطبيق على الجوال،
وتشغيل لوحة الأدمن. الأوامر مكتوبة لـ **Windows (cmd)**، وتحت كل خطوة
ملاحظة لـ Mac إذا اختلفت.

> آخر نسخة دايماً هي الفرع الافتراضي على GitHub (`claude/qareeb-home-services-oxn9td`)،
> و`git clone` بينزّله لحاله.

## المتطلبات (مرة وحدة)

| الأداة | من وين |
|---|---|
| **Git** | https://git-scm.com/download/win (على Mac: `xcode-select --install`) |
| **Node.js 22.13 أو أحدث** (Expo SDK 58 بيحتاجه) | https://nodejs.org ← زر LTS |
| **تطبيق Expo Go** (آخر نسخة) | App Store أو Google Play ← ابحث "Expo Go" |
| الكمبيوتر والجوال على **نفس الواي فاي** | — |
| ملف **`mobile/.env`** (ومعه `admin/.env.local` للوحة) | صاحب المشروع ببعتهم بشكل خاص — مش موجودين على GitHub |

تأكد إن Node مركّب صح:

```cmd
node -v
```

لازم يطبع `v22.13` أو أعلى.

## 1) نزّل المشروع

افتح **cmd عادي** (مش "Run as administrator") واكتب سطر سطر:

```cmd
cd %USERPROFILE%
git clone https://github.com/jawad321-s/Qareeb_1st.git
cd Qareeb_1st
git log -1 --oneline
```

(على Mac: `cd ~` بدل السطر الأول.)

> ⚠️ **لا تنزّل المشروع جوّا `C:\Windows\System32`** (هو المكان اللي بتفتح عليه
> الطرفية لما تكون أدمن). هو مجلد نظام، وبعدين بيطلع خطأ `EPERM` عند التشغيل.
> المكان الصح: مجلدك الشخصي، مثل `C:\Users\<اسمك>\Qareeb_1st`.
>
> ولا تنزّله **ZIP** من GitHub: الـ ZIP ما بيتحدّث بـ `git pull`.

## 2) حط ملفات المفاتيح

انسخ الملفات اللي وصلتك لهون:

| الملف | مكانه |
|---|---|
| `.env` | `Qareeb_1st\mobile\.env` |
| `.env.local` | `Qareeb_1st\admin\.env.local` |

بدون `mobile\.env` التطبيق بيشتغل على **بيانات تجريبية** داخل الجوال (بتظهر
أزرار "Demo: Customer" و"Demo: Artisan")، مش على بياناتنا الحقيقية.

## 3) شغّل التطبيق على الجوال 📱

```cmd
cd %USERPROFILE%\Qareeb_1st\mobile
npm install
npx expo start -c
```

`npm install` أول مرة بياخد كم دقيقة. بعدها بيطلع **رمز QR** بالطرفية:

- **آيفون**: افتح الكاميرا العادية ← وجّهها على الـ QR ← اضغط الرابط ← بيفتح بـ Expo Go
- **أندرويد**: افتح Expo Go ← "Scan QR code" ← امسح الرمز

امسح الـ QR **الجديد** كل مرة، ولا تفتح المشروع من "Recently opened" بـ Expo Go
(ممكن يفتح نسخة قديمة).

### إذا طلع: "You're signed in to Expo Go as …, but not signed in to Expo CLI"

يعني الجوال مسجّل دخول على حساب Expo والكمبيوتر لأ. اختار وحدة:

1. **الأسهل:** بـ Expo Go ← Profile ← **Sign out**، وامسح الـ QR من جديد.
2. **سجّل دخول بالطرفية بنفس الحساب** (بدون متصفح، لأن الدخول بالمتصفح بيوقف
   بخطأ على Windows بهاي النسخة من Expo):
   ```cmd
   npx expo login --no-browser
   npx expo whoami
   ```
3. **بتوكن** (إذا الحساب معمول بـ Google وما إله كلمة مرور): من expo.dev ←
   Account settings ← **Access tokens** ← Create token، وبعدين بنفس نافذة cmd:
   ```cmd
   set EXPO_TOKEN=الصق-التوكن-هون
   npx expo whoami
   npx expo start -c
   ```
   (بدون علامات تنصيص. بـ PowerShell بتنكتب: `$env:EXPO_TOKEN="..."`.)
   التوكن سرّي: لا تبعته لحدا ولا تحطه بأي ملف بالمشروع.

## 4) شغّل لوحة الأدمن 🖥️ (بنافذة cmd ثانية)

```cmd
cd %USERPROFILE%\Qareeb_1st\admin
npm install
npm run dev
```

افتح المتصفح على **http://localhost:3000** وسجّل دخول بإيميل الأدمن وكلمة مروره.
(إنشاء حساب الأدمن مشروح بـ [FIREBASE_SETUP.md](FIREBASE_SETUP.md)، الخطوة 5.)
على البيانات التجريبية: أي إيميل صحيح + كلمة مرور 6 أحرف أو أكثر.

## كل ما ينرفع تحديث جديد

```cmd
cd %USERPROFILE%\Qareeb_1st
git pull
cd mobile
npm install
npx expo start -c
```

إذا `git pull` رفض بسبب تعديلات عندك على الجهاز، هدول بيحفظوا تعديلاتك
بفرع احتياطي وبيرجّعوا نسختك طبق الأصل عن GitHub:

```cmd
git fetch origin
git stash
git branch backup-mine
git checkout -B claude/qareeb-home-services-oxn9td origin/claude/qareeb-home-services-oxn9td
```

## حل المشاكل الشائعة

| المشكلة | الحل |
|---|---|
| `package.json does not exist` أو `ENOENT … package.json` | إنت بالمجلد الغلط: الأوامر بتنكتب جوّا `mobile` (أو `admin`)، مش بـ `Qareeb_1st` نفسه |
| `not a git repository` | إنت مش جوّا مجلد المشروع: اعمل `cd %USERPROFILE%\Qareeb_1st` أول |
| `EPERM: operation not permitted` | المشروع بمجلد نظام أو انركّبت مكتباته كأدمن: نزّله من جديد بمجلدك الشخصي (الخطوة 1) |
| التطبيق بيفتح على نسخة قديمة | سكّر كل نافذة فيها Expo (`Ctrl + C`)، سكّر Expo Go من الجوال، شغّل `npx expo start -c` وامسح الـ QR الجديد |
| QR ما بيفتح / timeout | تأكد من نفس الواي فاي، أو شغّل `npx expo start -c --tunnel` |
| `permission-denied` بالتطبيق | قواعد Firestore الجديدة مش منشورة: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)، الخطوة 3 |
| خطأ عند `npm install` | تأكد من `node -v` (22.13 أو أحدث)، احذف مجلد `node_modules` وأعد `npm install` |
| بيطلب نسخة أحدث من Expo Go | حدّث Expo Go من المتجر (المشروع على SDK 58) |

## معلومات إضافية

- **أول تشغيل بالعربي** بيعيد تشغيل التطبيق مرة وحدة لحاله (ثانية تقريباً)، عشان يضبط
  اتجاه الكتابة من اليمين لليسار. وتبديل اللغة كمان بيعيد التشغيل. هاد طبيعي.
- **معاينة على المتصفح:** بعد `npx expo start` اضغط `w` بالطرفية.
- **إعداد Firebase نفسه** (القواعد، حساب الأدمن، البيانات الأساسية) لصاحب المشروع:
  [FIREBASE_SETUP.md](FIREBASE_SETUP.md).
