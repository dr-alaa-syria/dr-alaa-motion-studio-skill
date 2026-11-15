# التثبيت (ملخص عربي)

**المنصة للإصدار 0.1.0:** ويندوز 11 بنظام 64 بت فقط.

> **الحالة:** هذه الخطوات هي الإعداد المقصود، لكنها **لم تُختبر بعد على جهاز نظيف**. أبلغ عن أي خطوة لا تعمل.

## 1. تثبيت الأدوات

- **Python 3.12**: من python.org، مع تفعيل خيار "Add python.exe to PATH". ثم شغّل `pip install -r requirements.txt` من مجلد المستودع.
- **Node.js**: من nodejs.org. اختُبر الإصدار v26.13.0 فقط.
- **FFmpeg مع ffprobe**: ثبّت نسخة ويندوز وأضف مجلد `bin` إلى PATH. تأكد من وجود المحركات `libx264` و`prores_ks` و`libmp3lame` عبر `ffmpeg -encoders`.
- **Google Chrome**: للرندر. Chromium يعمل أيضاً.
- **Blender 5.3.0** (اختياري): لقالب لقطة المنتج فقط. اختُبر هذا الإصدار فقط.
- **Inkscape** (اختياري): لقياس صناديق الشعار فقط.

## 2. إعداد المسارات (اختياري)

انسخ `studio.config.example.json` إلى `studio.config.json` وعدّل القيم:

- `workspace`: مكان المشاريع والرندرات والتصديرات. الافتراضي `%USERPROFILE%\MotionStudio`.
- `blender` و`chrome` و`inkscape`: المسار الكامل للملف التنفيذي، وإلا يُكتشف تلقائياً.

متغيرات البيئة تتقدم على الملف: `MOTION_STUDIO_WORKSPACE`، و`BLENDER_PATH`، و`CHROME_PATH`، و`INKSCAPE_PATH`.

## 3. خطوط الهوية المثال

حمّل خطي **Cairo** و**Poppins** (بوزنَي 400 و700) من Google Fonts، وضعها في `brands/example/fonts/` بالأسماء التالية:
`Cairo-Regular.ttf`، و`Cairo-Bold.ttf`، و`Poppins-Regular.ttf`، و`Poppins-Bold.ttf`.

الخطوط غير مرفقة مع المستودع.

## 4. التحقق

```powershell
python scripts/studio.py check
python scripts/studio.py init
```

## 5. سياسة PowerShell

إذا منع PowerShell تشغيل `scripts\Studio.ps1`، اسمح بالسكربتات المحلية لحسابك فقط:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## ما لم يُتحقق منه بعد

- أقل إصدار Node.js: حزمة Remotion لا تحدده. التطوير تم على Node.js 26.
- أقل إصدار Python: 3.12 هو المستخدم، وغيره غير مختبر.
- وجود أحرف عربية أو مسافات في مسار مساحة العمل: غير مختبر.
