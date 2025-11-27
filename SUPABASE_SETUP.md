# 🚀 Налаштування Supabase для Time Tracker Mini App

Цей документ містить покрокову інструкцію для переходу з Google Sheets на Supabase.

---

## 📋 Зміст

1. [Створення проєкту Supabase](#1-створення-проєкту-supabase)
2. [Виконання міграцій бази даних](#2-виконання-міграцій-бази-даних)
3. [Налаштування змінних оточення](#3-налаштування-змінних-оточення)
4. [Налаштування Vercel](#4-налаштування-vercel)
5. [Перевірка роботи](#5-перевірка-роботи)
6. [Міграція даних з Google Sheets](#6-міграція-даних-з-google-sheets-опціонально)

---

## 1. Створення проєкту Supabase

### Через Vercel (Рекомендовано):

1. Відкрийте [Vercel Dashboard](https://vercel.com/dashboard)
2. Виберіть ваш проєкт
3. Перейдіть до **Storage** → **Create Database**
4. Оберіть **Supabase** (Postgres)
5. Дайте назву базі даних (наприклад, `time-tracker-db`)
6. Натисніть **Create**

Vercel автоматично:
- Створить Supabase проєкт
- Встановить змінні оточення
- Інтегрує базу даних з вашим проєктом

### Вручну (Альтернативний спосіб):

1. Зайдіть на [Supabase](https://app.supabase.com/)
2. Натисніть **New Project**
3. Заповніть:
   - **Name**: `time-tracker`
   - **Database Password**: (збережіть цей пароль!)
   - **Region**: Оберіть найближчий до користувачів
4. Натисніть **Create new project**
5. Зачекайте ~2 хвилини поки проєкт створюється

---

## 2. Виконання міграцій бази даних

### Спосіб 1: Через Supabase Dashboard (Найпростіший)

1. Перейдіть в **SQL Editor** у вашому Supabase проєкті
2. Відкрийте файл `/app/supabase/migrations/001_initial_schema.sql`
3. Скопіюйте весь вміст
4. Вставте в SQL Editor і натисніть **Run**
5. Повторіть для файлу `002_row_level_security.sql`

### Спосіб 2: Через Supabase CLI

```bash
# Встановіть Supabase CLI (якщо ще не встановлено)
npm install -g supabase

# Увійдіть в акаунт
supabase login

# Під'єднайтесь до проєкту
supabase link --project-ref your-project-id

# Виконайте міграції
supabase db push
```

---

## 3. Налаштування змінних оточення

### Отримайте API ключі:

1. В Supabase Dashboard перейдіть до:
   **Settings** → **API**

2. Знайдіть:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (довгий ключ)

### Локальна розробка (.env):

Створіть файл `/app/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 4. Налаштування Vercel

### Автоматично (якщо створили через Vercel):

Змінні вже налаштовані! ✅

### Вручну:

1. Відкрийте ваш проєкт на [Vercel Dashboard](https://vercel.com/dashboard)
2. Перейдіть до **Settings** → **Environment Variables**
3. Додайте змінні:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production, Preview, Development |

4. Натисніть **Save**
5. **Redeploy** проєкт для застосування змін:
   - **Deployments** → Останній deployment → **⋯** → **Redeploy**

---

## 5. Перевірка роботи

### Локально:

```bash
cd /app
npm install
npm run dev
```

Відкрийте http://localhost:5174/

### Перевірте що працює:

1. ✅ Реєстрація працівника
2. ✅ Вхід менеджера
3. ✅ Подача годин
4. ✅ Подача процесів
5. ✅ Подача матеріалів

### Перевірте базу даних:

1. Supabase Dashboard → **Table Editor**
2. Перевірте таблиці:
   - `users`
   - `hours`
   - `processes`
   - `materials`

---

## 6. Міграція даних з Google Sheets (Опціонально)

Якщо у вас є дані в Google Sheets, їх можна експортувати та імпортувати:

### Експорт з Google Sheets:

1. Відкрийте кожен лист (Users, Hours, Processes тощо)
2. **File** → **Download** → **CSV**

### Імпорт в Supabase:

1. Supabase Dashboard → **Table Editor**
2. Оберіть таблицю (наприклад, `users`)
3. **Insert** → **Import data from CSV**
4. Завантажте CSV файл
5. Перевірте mapping колонок
6. Натисніть **Import**

### Альтернатива - Скрипт міграції:

Можна створити скрипт який автоматично перенесе дані:

```typescript
// scripts/migrate-from-sheets.ts
// TODO: Створити скрипт якщо потрібно
```

---

## 🎯 Структура бази даних

### Таблиці:

- **users** - Користувачі (працівники + менеджери)
- **levels** - Рівні з погодинними ставками
- **objects** - Об'єкти/проєкти
- **process_types** - Типи процесів
- **hours** - Відпрацьовані години
- **processes** - Виконані процеси
- **materials** - Використані матеріали ✨ НОВЕ
- **assignments** - Завдання від менеджерів
- **additional_works** - Додаткові роботи

### Індекси:

Створені для швидкого пошуку по:
- `user_id + date`
- `object`
- `status`
- `telegram_id`

### Row Level Security (RLS):

✅ Працівники бачать тільки свої дані
✅ Менеджери бачать дані своєї команди
✅ Всі можуть читати довідники (levels, objects, process_types)

---

## 🔧 Troubleshooting

### Проблема: "Failed to connect to Supabase"

**Рішення:**
1. Перевірте `.env` файл
2. Переконайтесь що змінні починаються з `VITE_`
3. Перезапустіть dev server: `npm run dev`

### Проблема: "Row Level Security violation"

**Рішення:**
1. Перевірте що виконали міграцію `002_row_level_security.sql`
2. Перевірте що встановлено контекст користувача:
   ```typescript
   await setCurrentUserContext(userId);
   ```

### Проблема: "Cannot insert/update data"

**Рішення:**
1. Перевірте RLS політики в Supabase Dashboard
2. **Authentication** → **Policies**
3. Переконайтесь що політики активні

---

## 📚 Додаткові ресурси

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase + Vercel Integration](https://vercel.com/docs/storage/vercel-postgres/using-an-orm#supabase)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist міграції

- [ ] Створено Supabase проєкт
- [ ] Виконано міграції (001 + 002)
- [ ] Додано змінні оточення (.env)
- [ ] Налаштовано Vercel Environment Variables
- [ ] Локально працює підключення
- [ ] Production deployment успішний
- [ ] Перевірено всі функції (годин, процеси, матеріали)
- [ ] (Опціонально) Перенесено дані з Google Sheets
- [ ] Видалено Google Sheets код і залежності

---

**Готово! 🎉** Ваш додаток тепер працює на Supabase!
