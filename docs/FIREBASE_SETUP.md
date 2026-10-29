# تشغيل قريب على Firebase 🔥

بدون أي إعداد، التطبيق ولوحة الأدمن يشتغلان على **بيانات تجريبية** داخل الجهاز.
هذا الدليل لتشغيلهما على **Firebase الحقيقي**، بحيث يرى الجميع نفس البيانات:
الطلب الذي ينشئه زبون يظهر للحرفي، وكل شيء يظهر في لوحة الأدمن.
(التفاصيل التقنية للربط في [INTEGRATION.md](INTEGRATION.md).)

## مين يعمل إيش؟

| الخطوة | مين | كم مرة |
|---|---|---|
| 1–5: تفعيل الدخول، القواعد، البيانات، حساب الأدمن | صاحب مشروع Firebase | **مرة وحدة** للمشروع (والقواعد كل ما تتغيّر) |
| 6–7: ملفات المفاتيح وتشغيل التطبيق | كل واحد بالفريق | مرة على كل جهاز |

---

## 1) تفعيل تسجيل الدخول (Firebase Console)

1. افتح https://console.firebase.google.com واختر المشروع.
2. **Build → Authentication → Get started** (إذا ما كان مفعّلاً).
3. تبويب **Sign-in method** → اختر **Email/Password** → فعّل الخيار الأول **Enable** → **Save**.

> ليش Email/Password؟ الزبون والحرفي يدخلون **برقم الجوال وكلمة المرور فقط**،
> بس Firebase يحتاج معرّفاً داخلياً بشكل إيميل. التطبيق يبنيه تلقائياً من الرقم
> ونوع الحساب (مثل `customer-599123456@phone.qareeb.app`)، فنفس الرقم يقدر يكون
> له حساب زبون وحساب حرفي منفصلين. لا أحد يراه أو يكتبه.
> **الأدمن** وحده يدخل لوحة الإدارة بإيميل حقيقي وكلمة مرور (الخطوة 5).

## 2) إنشاء قاعدة البيانات

**Build → Firestore Database → Create database** (إذا ما كانت موجودة) → اختر
**production mode** وأقرب موقع.

## 3) رفع قواعد الحماية والفهارس

القواعد في `firebase/firestore.rules`. **كل ما تتغيّر لازم ترفعها من جديد**، وإلا
بيطلع خطأ `permission-denied`. طريقتين:

**من الموقع (الأسهل):** انسخ كل محتوى `firebase/firestore.rules` →
Firebase Console → **Firestore Database → Rules** → امسح القديم والصق → **Publish**.

**من الطرفية:**

```bash
cd firebase
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project qareeb-b9a54
```

## 4) تعبئة البيانات الأساسية (seed)

1. Firebase Console → ⚙️ **Project settings → Service accounts → Generate new private key**.
2. احفظ الملف باسم `firebase/seed/service-account.json`.
   **لا ترفعه على GitHub أبداً** (هو مستثنى تلقائياً)، ولا تبعثه لأحد.
3. شغّل:

```bash
cd firebase
npm install
npm run seed
```

هذا يعبّي **الفئات والخدمات فقط** (بدون أشخاص أو طلبات وهمية).

- `npm run seed -- --demo` يضيف زبوناً وحرفيين وطلباً تجريبياً (للتجربة فقط).
- `npm run seed -- --clean-demo` يحذف كل البيانات التجريبية.

## 5) حساب الأدمن (لوحة الإدارة)

```bash
cd firebase
node scripts/create-admin.mjs admin@example.com 'كلمة-مرور-قوية'
```

ينشئ الحساب ويعطيه صلاحية الأدمن. تشغيله مرة ثانية لنفس الإيميل يغيّر كلمة المرور.
وفي صفحة دخول اللوحة زر **نسيت كلمة المرور؟** يرسل رابطاً على الإيميل.

---

## 6) ملفات المفاتيح (كل واحد بالفريق)

المفاتيح من: Project settings → General → Your apps → Web app → `firebaseConfig`.
هذه الملفات **لا تُرفع على GitHub** — صاحب المشروع يرسلها للفريق بشكل خاص.

**التطبيق** — ملف `mobile/.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_USE_MOCK=false
```

**لوحة الأدمن** — ملف `admin/.env.local`: نفس القيم، لكن كل اسم يبدأ بـ
`NEXT_PUBLIC_` بدل `EXPO_PUBLIC_` (بدون سطر `USE_MOCK`).

## 7) التشغيل

```bash
cd mobile
npm install
npx expo start -c
```

```bash
cd admin
npm install
npm run dev
```

> كل ما تغيّر ملف `.env` (مثلاً من البيانات التجريبية إلى Firebase أو العكس)،
> شغّل بـ `-c` — وإلا Expo يكمل بالإعدادات القديمة من الذاكرة المؤقتة.
> التطبيق على **Expo SDK 58**: حدّث Expo Go على الجوال لآخر نسخة.

---

## التجربة بدون لمس المشروع الحقيقي (اختياري)

محاكيات Firebase تشتغل على جهازك (تحتاج Java):

```bash
cd firebase
npx firebase-tools emulators:start --only auth,firestore --project demo-qareeb
```

وبطرفية ثانية عبّئ البيانات فيها:

```bash
cd firebase
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=demo-qareeb npm run seed -- --demo
```

(على Windows PowerShell: `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; $env:GCLOUD_PROJECT="demo-qareeb"; npm run seed -- --demo`)

ثم أضف لملف `mobile/.env` السطر التالي، مع عنوان IP الكمبيوتر على الشبكة
(الجوال لازم يوصل له):

```env
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=192.168.1.20
```

ولوحة الأدمن (`admin/.env.local`): `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1`.

---

## ما زال ناقصاً أو تجريبياً على Firebase

- **الإشعارات** والتوزيع التلقائي من السيرفر تحتاج نشر Cloud Functions (خطة **Blaze**).
  بدونها، التطبيق يطبّق قواعد التوزيع بنفسه (الفئة، المسافة، أوقات العمل، التوثيق).
- **رمز التحقق (OTP)** بعد إنشاء الحساب: أي رمز يُقبل، ولا تُرسل رسالة SMS (يحتاج Blaze).
- **نسيت كلمة المرور** في التطبيق (للزبون والحرفي) غير مفعّل بعد؛ الأدمن فقط عنده رابط بالإيميل.
- **صور المعرض والمحادثة** تحتاج تفعيل **Storage** (خطة Blaze). صور **التوثيق** لا تحتاجه:
  تُحفظ مضغوطة في Firestore.
- **الدفع** في الاشتراكات محاكاة، ولا يوجد خصم حقيقي.
