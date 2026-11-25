# تشغيل قريب على Firebase 🔥

بدون أي إعداد، التطبيق ولوحة الأدمن يشتغلان على **بيانات تجريبية** داخل الجهاز.
هذا الدليل لتشغيلهما على **Firebase الحقيقي**، بحيث يرى الجميع نفس البيانات:
الطلب الذي ينشئه زبون يظهر للحرفي، وكل شيء يظهر في لوحة الأدمن.
(التفاصيل التقنية للربط في [INTEGRATION.md](INTEGRATION.md).)

## مين يعمل إيش؟

| الخطوة | مين | كم مرة |
|---|---|---|
| 1–5: تفعيل الدخول، القواعد، البيانات، حساب الأدمن | صاحب مشروع Firebase | **مرة وحدة** للمشروع (والقواعد كل ما تتغيّر) |
| 6–7: تشغيل التطبيق واللوحة | كل واحد بالفريق | مرة على كل جهاز |

---

## 1) تفعيل تسجيل الدخول (Firebase Console)

1. افتح https://console.firebase.google.com واختر المشروع.
2. **Build → Authentication → Get started** (إذا ما كان مفعّلاً).
3. تبويب **Sign-in method** → اختر **Email/Password** → فعّل الخيار الأول **Enable** → **Save**.
4. بنفس التبويب: **Add new provider** → **Phone** → **Enable** → **Save**. هاد لرمز التحقق
   برسالة SMS لما الزبون أو الحرفي ينسى كلمة المرور. وإذا في إعداد **SMS region policy**،
   خلّيه يسمح بفلسطين. كل رسالة إلها سعر حسب البلد، بينخصم من رصيد Blaze.

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

### نشر اللوحة على رابط مباشر (Firebase Hosting)

دبل كليك على **`deploy-admin.cmd`** (أو `deploy-admin.command` على الماك). بيجيب آخر
نسخة، وبيبني اللوحة كموقع، وبينشرها على **https://qareeb-b9a54.web.app**. أو بالأوامر:

```bash
cd admin
npm ci
npm run build
npx firebase-tools deploy --only hosting --project qareeb-b9a54
```

- أول مرة على الجهاز: `npx firebase-tools login`.
- إذا طلع خطأ إنه ما في Hosting site: Firebase Console ← **Hosting** ← **Get started**
  (كمّل الخطوات بدون ما تنفّذ أوامرها)، وبعدين أعد النشر.
- اللوحة كلها بتشتغل بالمتصفح وبتحكي مع Firebase مباشرة، وقواعد Firestore هي اللي
  بتحمي البيانات: الدخول بس لحساب عنده صلاحية الأدمن.

---

## 6) ملفات المفاتيح (اختيارية)

إعدادات مشروعنا (`qareeb-b9a54`) **مبنية جوّا الكود** (`mobile/src/lib/config.ts`
و`admin/lib/config.ts`)، فما حدا بالفريق بيحتاج ملفات مفاتيح: بعد `git clone`
التطبيق واللوحة بيشتغلوا على بياناتنا مباشرة. هاي الإعدادات مش سرّية (كل نسخة من
التطبيق بتحملها)، والحماية الحقيقية هي قواعد Firestore.

الملفات تحت بتلزم بس لتشغيلهم على **مشروع Firebase ثاني** (القيم من Project settings →
General → Your apps → Web app → `firebaseConfig`)، أو على البيانات التجريبية
(`EXPO_PUBLIC_USE_MOCK=true`). قيمها بتتقدّم على الإعدادات المبنية بالكود.

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

## النسخ الاحتياطي لقاعدة البيانات

مرة وحدة على جهاز مياس (المسجّل دخول على Firebase): دبل كليك على **`backup-setup.cmd`**
(أو `backup-setup.command` على الماك). بيشغّل نسخ احتياطي تلقائي لـ Firestore:

- **كل يوم**، وكل نسخة بتضل **7 أيام**.
- **كل جمعة**، وكل نسخة بتضل **14 أسبوع**.

Google بتحتفظ بالنسخ (مش على الجهاز)، والتكلفة حسب حجم البيانات وهي صغيرة. تشغيل السكربت مرة ثانية
بيعرض الجداول والنسخ الموجودة بس. صور المعرض والمحادثة اللي على Storage مش داخلة بهالنسخ.

**الاسترجاع** (لما يضيع إشي): من مجلد `firebase`:

1. `npx firebase-tools firestore:backups:list --location eur3 --project qareeb-b9a54`
   بيعرض النسخ، وكل وحدة إلها اسم طويل بيبدأ بـ `projects/qareeb-b9a54/locations/eur3/backups/…`.
2. `npx firebase-tools firestore:databases:restore --database restored --backup <اسم النسخة> --project qareeb-b9a54`
   بيرجّع النسخة لقاعدة بيانات **جديدة** اسمها `restored` (القاعدة الحالية ما بتتغيّر).
   من هناك بتنشاف البيانات بالـ Console وبترجع للقاعدة الأصلية حسب المطلوب (بمساعدة مطوّر).

---

## رسائل SMS للأرقام الفلسطينية (reCAPTCHA SMS Defense)

Google ما بتبعت رمز SMS لشبكات معيّنة (منها جوال وأوريدو) إلا إذا كان مفعّل
بالمشروع **reCAPTCHA SMS Defense** على وضع **Enforce**. بدونه بيرجع خطأ
`auth/error-code:-39` (رد دعم Firebase، نوفمبر 2026). التطبيق جاهز لهاد الوضع
(بيبعت رمز reCAPTCHA Enterprise لحاله، من غير أي شي يضغطه المستخدم).

**اللي انعمل (25 نوفمبر 2026):**
1. Google Cloud ← **reCAPTCHA Enterprise API** ← Enable.
   (أول 10,000 فحص بالشهر مجاناً؛ كل طلب رمز = فحص.)
2. حساب خدمة Identity Platform مع صلاحيته، وبدونه فايربيس ما بيقدر يعمل
   مفاتيح reCAPTCHA:
   ```
   gcloud beta services identity create --service=identitytoolkit.googleapis.com --project=qareeb-b9a54
   gcloud projects add-iam-policy-binding qareeb-b9a54 --member="serviceAccount:service-274723476834@gcp-sa-identitytoolkit.iam.gserviceaccount.com" --role="roles/identitytoolkit.serviceAgent" --condition=None --format=none
   ```
3. SMS defense (بلّش AUDIT وصار ENFORCE) مع حد خطر 0.8، وفايربيس عمل لحاله مفاتيح Web وiOS
   وAndroid. ما تعدّلوا ولا تحذفوا المفاتيح اللي اسمها
   "Key for Identity Platform integration with reCAPTCHA"، ولا تعملوا مفتاح
   باليد من صفحة Fraud Defense.

4. مفتاح التطبيق (APIs & Services ← Credentials ← **Browser key (auto created by
   Firebase)** ← API restrictions) لازم يكون فيه **reCAPTCHA Enterprise API**.
   فايربيس بيفحص رمز reCAPTCHA باسم هاد المفتاح، وبدونه كل طلب رمز بيرجع
   `auth/invalid-recaptcha-token` مع إن الرمز سليم.

5. Google Cloud ← Security ← **Fraud Defense** ← **Settings** ← **SMS defense** ←
   Configure ← **Enable** ← Save. هاي كانت آخر خطوة، وبعدها وصلت الرسالة لرقم
   أوريدو. بدونها فايربيس بيطلب تقييم خطر الرقم وما بيرجعله إشي، فبيرفض كل
   طلب بـ `auth/invalid-recaptcha-token`. التحذير الأصفر عن "Annotate" اختياري
   (بيحسّن دقة التقييم بس).

**النتيجة (25 نوفمبر 2026):** رمز "نسيت كلمة السر" وصل لرقم أوريدو فلسطيني
على وضع **ENFORCE**.

**الأوامر** (Google Cloud ← زر **Cloud Shell** `>_` فوق؛ إذا قال ما في حساب:
`gcloud auth login` مرة وحدة):
- عرض الحالة:
  ```
  curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "X-Goog-User-Project: qareeb-b9a54" -H "Content-Type: application/json" "https://identitytoolkit.googleapis.com/v2/projects/qareeb-b9a54/config" | jq .recaptchaConfig
  ```
- **Enforce** (اللي بيخلي جوال وأوريدو يوصلهم الرمز):
  ```
  curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "X-Goog-User-Project: qareeb-b9a54" -H "Content-Type: application/json" -X PATCH "https://identitytoolkit.googleapis.com/v2/projects/qareeb-b9a54/config?updateMask=recaptchaConfig.phoneEnforcementState" -d '{"recaptchaConfig":{"phoneEnforcementState":"ENFORCE"}}' | jq '.recaptchaConfig // .error'
  ```
- رجوع لـ **Audit**: نفس الأمر مع `AUDIT` بدل `ENFORCE`.
- إطفاء كامل (لازم الاتنين مع بعض، وإلا بيرفض):
  ```
  curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" -H "X-Goog-User-Project: qareeb-b9a54" -H "Content-Type: application/json" -X PATCH "https://identitytoolkit.googleapis.com/v2/projects/qareeb-b9a54/config?updateMask=recaptchaConfig.phoneEnforcementState,recaptchaConfig.useSmsTollFraudProtection" -d '{"recaptchaConfig":{"phoneEnforcementState":"OFF","useSmsTollFraudProtection":false}}' | jq '.recaptchaConfig // .error'
  ```
- أو من جهاز فيه `firebase/seed/service-account.json`، داخل `firebase/`:
  `npm run sms-defense -- audit|enforce|off`.

**التأكد إنه شغال:** بعد طلب رمز من التطبيق، Google Cloud ← Security ←
**Fraud Defense** ← Dashboard: عدد **Assessments** لازم يزيد عن 0. وراقبوا
Authentication ← Usage ← SMS Usage. بعد ما يشتغل رجّعوا "رمز SMS عند إنشاء
حساب" بلوحة التحكم.

## ما زال ناقصاً أو تجريبياً على Firebase

- **الإشعارات والتوزيع من السيرفر:** المشروع على **Blaze**، والـ Cloud Functions منشورة
  (`europe-west1`، بجانب قاعدة البيانات `eur3`). لإعادة نشرها مع القواعد بعد أي تعديل عليها:
  `cd firebase` ثم `npx firebase-tools deploy --only functions,firestore:rules --project qareeb-b9a54`.
  الإشعارات بتوصل على **آيفون** من Expo Go. على **أندرويد** Expo Go ما بيدعمها، فبتحتاج
  نسخة APK من التطبيق. التطبيق مربوط بمشروع Expo `project-2026-2027/qareeb`
  (`mobile/app.json`).
- **رمز التحقق (SMS) عند إنشاء حساب جديد:** مفعّل. الحساب بينعمل بس بعد الرمز الصح، والرقم
  اللي إله حساب من نفس النوع بينرفض قبل ما تنبعت أي رسالة. بينطفى ويرجع من لوحة التحكم ←
  **الإعدادات** ← **رمز SMS عند إنشاء حساب** (التطبيق بيلتزم فوراً، بدون نسخة جديدة).
  إذا الرموز ما وصلت (مثل خطأ `auth/error-code:-39` من قبل، وهو رفض من Firebase نفسه):
  طفّيه من هون، وجرّبوا من Firebase Console ← Authentication ← Sign-in method ← **Phone** ←
  **Phone numbers for testing**: رقم تجريبي برمز ثابت بيثبت إنه الإعداد كله صح بدون SMS حقيقي.
- **نسيت كلمة المرور** في التطبيق: رمز SMS حقيقي (Firebase Phone Auth). قبل الإرسال بيطلع
  مربع "أنا لست روبوت" (reCAPTCHA)، وبعد الرمز الـ Cloud Function `resetPasswordWithPhone`
  بتغيّر كلمة المرور. بيحتاج تفعيل **Phone** (الخطوة 1) ونشر الـ functions.
- **الدعم وإيقاف الحساب:** زر السماعة بالرئيسية (أو المساعدة) بيفتح محادثة مع فريق قريب،
  والرد من لوحة التحكم ← **الدعم** (الشخص بيوصله إشعار بالرد). الحساب الموقوف بيقدر يسجّل
  دخول بس لشاشة "تم إيقاف حسابك" ومحادثة الدعم: الإيقاف بيحط علامة `suspended` على حسابه
  وقواعد Firestore بترفض أي إشي غير هيك. بيحتاج نشر القواعد والـ functions.
- **تغيير كلمة المرور وحذف الحساب** من التطبيق (تعديل الملف الشخصي): التغيير يتأكد من
  كلمة المرور الحالية ويحدّثها على Firebase Auth مباشرة. الحذف عبر الـ Cloud Function
  `deleteMyAccount` (بيحتاج نشر الـ functions)، ومرفوض لو عند الشخص طلب قيد التنفيذ.
  **الحذف مؤقت (Soft delete):** الحساب ما بينمسح من قاعدة البيانات، بيضل بقائمة المستخدمين
  بلوحة التحكم وحالته **محذوف**. تسجيل دخوله بيتعطّل، ورقمه بيتحرر، فبيقدر صاحبه يسجّل من جديد
  بنفس الرقم كحساب جديد. ولو انحذف دخول حساب من Firebase Console (Authentication)، الـ function
  `onAuthUserDeleted` بتعلّمه **محذوف** فوراً، وفحص كل ساعة بيلقط أي حساب فاته هالشي.
- **إيقاف حساب من لوحة التحكم** بيطلب كلمة مرور الأدمن قبلها، والسيرفر بيتأكد إنها انكتبت
  آخر 5 دقائق.
- **صور المعرض والمحادثة** بتنرفع على **Storage** (مضغوطة، JPEG لحد 1600 بكسل)، وFirestore
  بيحفظ رابطها بس. لازم يكون Storage مفعّل (Firebase Console ← **Storage** ← **Get started**)
  وقواعده منشورة: `cd firebase` ثم `npx firebase-tools deploy --only storage --project qareeb-b9a54`.
  صور **التوثيق** بتضل بـ Firestore.
- **الدفع** في الاشتراكات محاكاة، ولا يوجد خصم حقيقي.
