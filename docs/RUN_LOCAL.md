# تشغيل مشروع قريب: طريقة الفريق الموحّدة 🚀

نفس الطريقة عند كل الفريق، وبنفس المكان، وبدون أوامر:

> 1. **المكان:** المشروع عند الكل على **سطح المكتب** باسم `Qareeb_1st`.
> 2. **التعديلات:** ما حدا بيعدّل الكود بإيده. كل التعديلات بتصير عن طريق Claude،
>    وبتنرفع على GitHub.
> 3. **التشغيل:** دبل كليك على **`start-app.cmd`** (التطبيق) و**`start-admin.cmd`**
>    (لوحة الأدمن). كل مرة بيجيبوا آخر نسخة من GitHub لحالهم.

## المتطلبات (مرة وحدة)

| الأداة | من وين |
|---|---|
| **Git** | https://git-scm.com/download/win ← ركّبه بالإعدادات الافتراضية |
| **Node.js 22.13 أو أحدث** (Expo SDK 58 بيحتاجه) | https://nodejs.org ← زر LTS |
| **تطبيق Expo Go** (آخر نسخة) | App Store أو Google Play ← ابحث "Expo Go" |
| الكمبيوتر والجوال على **نفس الواي فاي** | — |

ما في داعي لأي ملف مفاتيح: إعدادات Firebase تبعت مشروعنا مبنية جوّا الكود.

## التنزيل لأول مرة (مرة وحدة)

1. افتح **سطح المكتب** (Desktop) بـ File Explorer.
2. اضغط على **شريط العنوان** فوق (اللي مكتوب فيه المسار)، امسحه واكتب `cmd`
   واضغط Enter. بتفتح نافذة سوداء على سطح المكتب.
3. اكتب واضغط Enter:
   ```cmd
   git clone https://github.com/jawad321-s/Qareeb_1st.git
   ```
4. سكّر النافذة. صار عندك مجلد **`Qareeb_1st`** على سطح المكتب، وجوّاه
   `start-app.cmd` و`start-admin.cmd`.

> ⚠️ لا تنزّله **ZIP** من GitHub، ولا من نافذة cmd مفتوحة كـ "Run as administrator".
>
> **إذا عندك نسخة قديمة من المشروع على سطح المكتب** وما فيها `start-app.cmd`:
> افتح مجلد `Qareeb_1st`، اكتب `cmd` بشريط العنوان (مثل الخطوة 2)، وبعدين:
> ```cmd
> git fetch origin
> git checkout -f -B claude/qareeb-home-services-oxn9td origin/claude/qareeb-home-services-oxn9td
> ```
> أو احذف المجلد القديم ونزّله من جديد بالخطوات فوق.

## كل مرة: تشغيل التطبيق 📱

دبل كليك على **`start-app.cmd`** جوّا `Qareeb_1st`. هو بيعمل لحاله:

1. بيجيب آخر نسخة من GitHub، وبيطبع رقمها (مثل `Version: 87f30f5 …`).
2. بيركّب المكتبات إذا تغيّرت. أول مرة بياخد كم دقيقة، وبعدها بيتخطّاها.
3. بيشغّل التطبيق وبيطلّع **رمز QR**.

على الجوال:

- **آيفون**: افتح الكاميرا العادية ← وجّهها على الـ QR ← اضغط الرابط ← بيفتح بـ Expo Go
- **أندرويد**: افتح Expo Go ← "Scan QR code" ← امسح الرمز

امسح الـ QR **الجديد** كل مرة، ولا تفتح المشروع من "Recently opened" بـ Expo Go.
للإيقاف: `Ctrl + C` بالنافذة.

## لوحة الأدمن 🖥️

**الرابط المباشر:** **https://qareeb-b9a54.web.app** ← من أي متصفح، على الكمبيوتر
أو الجوال، بدون تشغيل أي إشي. سجّل دخول بإيميل الأدمن وكلمة مروره.

> الرابط بيعرض آخر نسخة **انرفعت** عليه. بعد أي تعديل على اللوحة، صاحب المشروع
> بيعمل دبل كليك على **`deploy-admin.cmd`** (على الماك: `deploy-admin.command`)
> عشان يحدّثه. أول مرة على الجهاز بدها `npx firebase-tools login`.

**أو على جهازك:** دبل كليك على **`start-admin.cmd`**. بعد كم ثانية بيفتح المتصفح على
**http://localhost:3000**. هاي دايماً بتشتغل على آخر كود من GitHub.

إذا بدك الاثنين مع بعض: شغّل `start-app.cmd` أول، واستنى لحد ما يطلع الـ QR،
وبعدين `start-admin.cmd`.

## لما ينرفع تعديل جديد

اطلب التعديل من Claude، وهو بيرفعه على GitHub. بعدها عند كل واحد بالفريق:
سكّر نافذة التطبيق (`Ctrl + C`)، ودبل كليك على `start-app.cmd` من جديد. هيك
بيجيب التعديل لحاله.

> السكربتات بترجّع المشروع **طبق الأصل عن GitHub** كل مرة. أي تعديل يدوي على
> ملفات المشروع بينمسح، وهاد مقصود: GitHub هو النسخة الوحيدة الصحيحة.

## إذا طلع: "You're signed in to Expo Go as …, but not signed in to Expo CLI"

يعني الجوال مسجّل دخول على حساب Expo والكمبيوتر لأ. **الحل:** بـ Expo Go ←
Profile ← **Sign out**، وامسح الـ QR من جديد.

## حل المشاكل الشائعة

| المشكلة | الحل |
|---|---|
| `Something went wrong` | خذ سكرين شوت للنافذة كاملة وابعتها |
| `Git is not installed` أو `Node.js is not installed` | ركّب الناقص من جدول المتطلبات، وسكّر وافتح السكربت من جديد |
| `This folder was not downloaded with git clone` | المشروع منزّل ZIP: نزّله من جديد بخطوات "التنزيل لأول مرة" |
| `Could not reach GitHub` | ما في إنترنت: التطبيق بيشتغل على آخر نسخة نزلت عندك |
| `EPERM: operation not permitted` | المشروع بمجلد نظام، أو انركّبت مكتباته من نافذة أدمن: نزّله من جديد على سطح المكتب |
| أزرار "Demo: Customer / Artisan" ظاهرة | عندك ملف `mobile\.env` قديم فيه `EXPO_PUBLIC_USE_MOCK=true`: احذفه وشغّل `start-app.cmd` من جديد |
| الجوال عالق على "Opening project…" أو QR ما بيفتح | تأكد إن الكمبيوتر والجوال على نفس الواي فاي، وإن **Expo Go** مسموحله بـ **Local Network** بإعدادات الآيفون. إذا ضل، شغّل **`start-app-tunnel`** بدل `start-app` (أول مرة بيسأل يركّب `@expo/ngrok`: جاوب `Y`) |
| `permission-denied` بالتطبيق | قواعد Firestore الجديدة مش منشورة: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)، الخطوة 3 |
| بيطلب نسخة أحدث من Expo Go | حدّث Expo Go من المتجر (المشروع على SDK 58) |
| `Cannot find native module 'ExpoAsset'` أو أي `Cannot find native module` | مكتبة زيادة على الكمبيوتر (من `npm install` بالإيد). `start-app` بيلاحظها وبيعيد تركيب المكتبات لحاله. إذا ضل: احذف مجلد `mobile\node_modules` وشغّل `start-app` من جديد |
| `git pull` بيطلّع `Your local changes … would be overwritten` وما بيسحب | ملف بالمشروع تغيّر على جهازك (غالباً من `npm install`). دبل كليك على `start-app.cmd` بيرجّع كل إشي لآخر نسخة. أو بالأوامر: `git checkout -- .` وبعدين `git pull`. وركّب المكتبات بـ `npm ci` مش `npm install` |

## على Mac 🍎

نفس الطريقة، بس الملفات اسمها بتنتهي بـ **`.command`** بدل `.cmd`.

### المتطلبات (مرة وحدة)

| الأداة | كيف |
|---|---|
| **Git** | افتح **Terminal** (`Cmd + Space` واكتب Terminal)، واكتب `git --version`. إذا طلعت نافذة بتطلب تركيب "developer tools" اضغط **Install** واستنى لحد ما يخلص |
| **Node.js 22.13 أو أحدث** | https://nodejs.org ← زر LTS ← نزّل ملف `.pkg` وركّبه |
| **Expo Go** على الجوال، ونفس الواي فاي | — |

### التنزيل لأول مرة

بالـ Terminal اكتب السطرين (كل واحد واضغط Enter):

```bash
cd ~/Desktop
git clone https://github.com/jawad321-s/Qareeb_1st.git
```

إذا سألك "Terminal would like to access files in your Desktop folder" اضغط **Allow**.
صار عندك مجلد **`Qareeb_1st`** على سطح المكتب.

### كل مرة

- التطبيق: دبل كليك على **`start-app.command`**
- لوحة الأدمن: دبل كليك على **`start-admin.command`**
- إذا الجوال علق على "Opening project…": **`start-app-tunnel.command`**

بيفتح Terminal وبيعمل نفس اللي بيعمله `start-app.cmd` على Windows: آخر نسخة،
والمكتبات، وبعدين الـ QR. للإيقاف: `Ctrl + C`.

### مشاكل خاصة بالماك

| المشكلة | الحل |
|---|---|
| "cannot be opened because it is from an unidentified developer" | كليك يمين على الملف ← **Open** ← **Open**. بعدها بيفتح عادي بالدبل كليك |
| نافذة "Do you want the application node to accept incoming network connections?" | اضغط **Allow**، وإلا الجوال ما بيقدر يوصل للكمبيوتر |
| `Permission denied` لما تفتح الملف | بالـ Terminal: `cd ~/Desktop/Qareeb_1st && chmod +x *.command` وجرّب مرة تانية |
| الملف بيفتح بمحرر نصوص بدل Terminal | كليك يمين ← Open With ← **Terminal** |

## معلومات إضافية

- **أول تشغيل بالعربي** بيعيد تشغيل التطبيق مرة وحدة لحاله (ثانية تقريباً)، عشان يضبط
  اتجاه الكتابة من اليمين لليسار. وتبديل اللغة كمان بيعيد التشغيل. هاد طبيعي.
- **معاينة على المتصفح:** بنافذة التطبيق اضغط `w`.
- **إعداد Firebase نفسه** (القواعد، حساب الأدمن، البيانات الأساسية) لصاحب المشروع:
  [FIREBASE_SETUP.md](FIREBASE_SETUP.md).
