# تشغيل قريب على Firebase 🔥

بدون أي إعداد، التطبيق ولوحة الأدمن يشتغلان على **بيانات تجريبية** داخل الجهاز.
هذا الدليل لتشغيلهما على **Firebase الحقيقي**، بحيث يرى الجميع نفس البيانات:
الطلب الذي ينشئه زبون يظهر للحرفي، وكل شيء يظهر في لوحة الأدمن.

## مين يعمل إيش؟

| الخطوة | مين | كم مرة |
|---|---|---|
| 1–4: تفعيل الدخول، رفع القواعد، تعبئة البيانات | صاحب مشروع Firebase | **مرة وحدة** للمشروع |
| 5–6: ملفات المفاتيح وتشغيل التطبيق | كل واحد بالفريق | مرة على كل جهاز |

---

## 1) تفعيل تسجيل الدخول (Firebase Console)

1. افتح https://console.firebase.google.com واختر المشروع.
2. **Build → Authentication → Get started** (إذا ما كان مفعّلاً).
3. تبويب **Sign-in method** → اختر **Email/Password** → فعّل الخيار الأول **Enable** → **Save**.

> ليش Email/Password؟ الدخول في التطبيق **برقم الجوال وكلمة المرور فقط**،
> بس Firebase يحتاج معرّفاً داخلياً بشكل إيميل. التطبيق يبنيه تلقائياً من الرقم
> ونوع الحساب (مثل `970599123456.customer@qareeb.app`). لا أحد يراه أو يكتبه،
> ولا يُرسل عليه أي شيء.

## 2) إنشاء قاعدة البيانات

**Build → Firestore Database → Create database** (إذا ما كانت موجودة) → اختر
**production mode** وأقرب موقع.

## 3) رفع قواعد الحماية والفهارس

على الكمبيوتر (مرة وحدة):

```bash
npm install -g firebase-tools
firebase login
```

ثم من مجلد المشروع:

```bash
cd firebase
firebase deploy --only firestore --project <PROJECT_ID>
```

`<PROJECT_ID>` تجده في Project settings (مثلاً `qareeb-b9a54`).

> ⚠️ بدون هذه الخطوة القواعد القديمة تضل مرفوعة، ورح يطلع خطأ
> `permission-denied`.

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

لتحديد كلمة مرور الأدمن بنفسك (بدل كلمة عشوائية):

- **Mac / Linux:** `SEED_ADMIN_PASSWORD=كلمة-قوية npm run seed`
- **Windows (PowerShell):** `$env:SEED_ADMIN_PASSWORD="كلمة-قوية"; npm run seed`

بدونها، الملف يطبع كلمة مرور عشوائية للأدمن **مرة وحدة** — انسخها واحفظها.

الملف ينشئ:

| الحساب | الرقم | كلمة المرور |
|---|---|---|
| الزبون التجريبي (ليلى) | `0590000001` | `qareeb123` |
| الحرفي التجريبي (عمر) | `0590000010` | `qareeb123` |
| حرفيون آخرون | `0590000011` … `0590000013` | `qareeb123` |
| **الأدمن** (لوحة الإدارة) | `0590000000` | اللي حددته أو المطبوعة |

أزرار **Demo** في شاشة الترحيب تدخل على حسابَي ليلى وعمر.
وأي شخص يقدر ينشئ حساباً جديداً من شاشة إنشاء الحساب.

---

## 5) ملفات المفاتيح (كل واحد بالفريق)

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

## 6) التشغيل

```bash
cd mobile
npx expo start -c
```

```bash
cd admin
npm run dev
```

> كل ما تغيّر ملف `.env` (مثلاً من البيانات التجريبية إلى Firebase أو العكس)،
> شغّل بـ `-c` — وإلا Expo يكمل بالإعدادات القديمة من الذاكرة المؤقتة.

للرجوع للبيانات التجريبية: `EXPO_PUBLIC_USE_MOCK=true` ثم `npx expo start -c`.

---

## التجربة بدون لمس المشروع الحقيقي (اختياري)

محاكيات Firebase تشتغل على جهازك (تحتاج Java):

```bash
cd firebase
firebase emulators:start --only auth,firestore --project demo-qareeb
```

وبطرفية ثانية عبّئ البيانات فيها:

```bash
cd firebase
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-qareeb npm run seed
```

ثم أضف لملف `mobile/.env` السطر التالي، مع عنوان IP الكمبيوتر على الشبكة
(الجوال لازم يوصل له):

```env
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=192.168.1.20
```

ولوحة الأدمن: `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1`.

---

## ما زال تجريبياً حتى على Firebase

- **رمز التحقق (OTP)** بعد إنشاء الحساب: أي رمز يُقبل، ولا تُرسل رسالة SMS.
- **نسيت كلمة المرور** و**تغيير كلمة المرور**: الشاشات موجودة، لكنها لا تغيّر كلمة المرور في Firebase.
- **رفع مستندات التوثيق** يحتاج تفعيل **Storage** في Firebase. المشاريع الجديدة
  تحتاج خطة Blaze لذلك. بدونه، كل شيء آخر يعمل.
- **الدفع** في الاشتراكات محاكاة، ولا يوجد خصم حقيقي.
