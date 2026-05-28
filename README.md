# SAFASITI BA SHARAF — منوی دیجیتال

منوی دیجیتال دوزبانه (فارسی/انگلیسی)، با پنل ادمین و دیتابیس Supabase.

---

## ساختار

- **`/`** — منوی پابلیک (مشتری‌ها این رو می‌بینن)
- **`/admin`** — پنل مدیریت (فقط با لاگین) با سه تب:
  - **آیتم‌ها** — افزودن/ویرایش/حذف غذاها، تغییر موجودی، تغییر دسته
  - **دسته‌بندی‌ها** — افزودن/ویرایش/حذف دسته‌ها (دیگه نیازی به SQL نیست)
  - **تنظیمات** — انتخاب فونت منو + اطلاعات تماس (تلفن، آدرس، اینستاگرام)
- **`/admin/qr`** — ساخت و دانلود کد QR منو برای چاپ و گذاشتن سر میز

---

## دیتابیس (آماده‌ست)

دیتابیس Supabase از قبل تنظیم شده توی پروژهٔ `basharaf-pays`:

- **URL:** `https://igtqpqhruikdnoozohja.supabase.co`
- **anon key:** `sb_publishable_NvKaiKI98WqBFv_gqfeFXg_yU182V6Z`

این مقادیر در فایل `.env.local.example` هم هستن.

جدول‌ها:
- `menu_categories` — سه دسته (پیش‌غذا، غذای اصلی، دسر) با ترتیب نمایش
- `menu_items` — همهٔ آیتم‌ها با عنوان دوزبانه، توضیح، قیمت، وضعیت موجودی

داده‌های اولیه ۳۱ آیتم از منوی نمونه‌ت (با تفکیک گزینه‌های «یا») سیدشده.

---

## ساخت کاربر ادمین (یک‌بار)

برای ورود به `/admin` یه کاربر Supabase لازم داری:

1. برو به [Supabase Dashboard](https://supabase.com/dashboard/project/igtqpqhruikdnoozohja/auth/users)
2. **Add user → Create new user**
3. ایمیل و رمز عبور رو وارد کن
4. **Auto Confirm User** رو تیک بزن (وگرنه باید ایمیل تأیید کنه)
5. **Create user**

از این به بعد با همون ایمیل/رمز توی `/admin` لاگین می‌کنی.

> برای حسین هم یه کاربر دوم بساز — هر دو کاربر دسترسی کامل به CRUD دارن.

---

## اجرای محلی

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

باز کن `http://localhost:3000` (منو) و `http://localhost:3000/admin` (پنل).

---

## دیپلوی به Vercel

سه راه:

### راه ۱ — درگ‌اند‌دراپ این پوشه

1. برو به [vercel.com/new](https://vercel.com/new)
2. این پوشه (یا فایل zip) رو درگ کن
3. توی **Environment Variables** این دو مقدار رو اضافه کن:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://igtqpqhruikdnoozohja.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_NvKaiKI98WqBFv_gqfeFXg_yU182V6Z`
4. **Deploy**

### راه ۲ — از طریق GitHub

1. این پوشه رو push کن به یه repo
2. توی Vercel: **Add New → Project → Import Git Repository**
3. همون env variableها رو ست کن
4. **Deploy**

### راه ۳ — Vercel CLI

```bash
npm i -g vercel
vercel
# جواب سؤال‌ها رو بده، بعد:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

بعد از دیپلوی یه URL مثل `safasiti-menu.vercel.app` می‌گیری. اون URL رو می‌تونی به مشتری‌ها بدی یا توی QR کد بذاری.

---

## معماری

```
app/
  layout.tsx          ── ریشهٔ اپ، LanguageProvider
  globals.css         ── design tokens + @font-face + اعمال فونت بر اساس زبان
  page.tsx            ── صفحهٔ منوی پابلیک (داده زنده از Supabase)
  admin/page.tsx      ── پنل ادمین (لاگین + CRUD)

components/
  LanguageToggle.tsx  ── دکمهٔ شناور EN/FA
  MenuSection.tsx     ── بلاک هر دسته
  MenuItem.tsx        ── ردیف هر آیتم
  BodyClass.tsx       ── ست‌کردن کلاس body برای تفکیک استایل منو/ادمین

lib/
  supabase.ts         ── کلاینت Supabase
  menu-data.ts        ── interfaceها + توابع fetch و CRUD
  i18n.tsx            ── context و state زبان
```

---

## منطق فونت‌ها

- **منوی پابلیک** (`body.is-menu`):
  - انگلیسی → `Gochi Hand`
  - فارسی → `NeveshtFaNum-Black`
- **پنل ادمین** (`body.is-admin`):
  - همیشه `Vazirmatn` یا فونت سیستم — چون این فونت‌های دکوراتیو برای فرم/جدول ضعیف‌ان

---

## اضافه‌کردن دسته‌بندی جدید

اگه بخوای یه دسته‌بندی جدید اضافه کنی (مثلاً «نوشیدنی»):

۱. توی Supabase SQL Editor:
```sql
insert into public.menu_categories (slug, label_en, label_fa, sort_order)
values ('drinks', 'Drinks', 'نوشیدنی', 40);
```

۲. حالا توی پنل ادمین، موقع افزودن آیتم جدید، می‌تونی این دسته رو انتخاب کنی.

> دلیل این که این کار از پنل نمی‌شه: دسته‌ها زیاد عوض نمی‌شن. اگه می‌خوای از پنل هم بشه، بگو اضافه‌اش می‌کنم.

---

## رفع اشکال

**صفحه خالی روی Vercel:** env variableها رو فراموش کردی. برو به Project Settings → Environment Variables و چک کن.

**خطا «Missing NEXT_PUBLIC_SUPABASE_URL»:** فایل `.env.local` رو از `.env.local.example` کپی نکردی.

**لاگین ادمین کار نمی‌کنه:** کاربر هنوز ساخته نشده یا Auto Confirm نزدی.

**آیتم‌ها لود می‌شن ولی مشتری نمی‌بینه چیزی:** احتمالاً RLS مشکل داره. توی Supabase SQL Editor چک کن:
```sql
select * from public.menu_items limit 1;
```

---

## فونت‌ها

`public/fonts/` شامل:
- `GochiHand-Regular.ttf`
- `NeveshtFaNum-Black.ttf`

اینا توی پروژه گنجونده شدن — نیازی به CDN خارجی نیست.
