# 🚀 Швидке Налаштування Supabase

## Крок 1: Створити Проект (2 хвилини)

### Варіант A: Через Vercel (Найпростіше) ⭐

1. Відкрити https://vercel.com/dashboard
2. Вибрати ваш проект
3. **Storage** → **Create Database** → **Supabase**
4. Натиснути **Create**
5. Vercel автоматично:
   - Створить Supabase проект
   - Встановить env змінні (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
   - З'єднає проекти

✅ **Переваги**: Автоматичне налаштування, env змінні додаються самі

### Варіант B: Вручну

1. Перейти на https://app.supabase.com
2. **New Project**
3. Заповнити:
   - **Name**: time-tracker
   - **Database Password**: створити надійний пароль (зберегти!)
   - **Region**: Europe (Frankfurt) або найближчий
4. **Create new project**
5. Почекати 2-3 хвилини

---

## Крок 2: Виконати SQL Міграції (3 хвилини)

### Міграція 1: Створити Таблиці

1. В Supabase Dashboard → **SQL Editor**
2. **New query**
3. Скопіювати ВЕСЬ вміст з файлу:
   ```
   /app/supabase/migrations/001_initial_schema.sql
   ```
4. Вставити в SQL Editor
5. Натиснути **Run** (або Ctrl+Enter)
6. Перевірити: **Success. No rows returned**

### Міграція 2: Налаштувати RLS

1. **New query** в SQL Editor
2. Скопіювати ВЕСЬ вміст з файлу:
   ```
   /app/supabase/migrations/002_row_level_security.sql
   ```
3. Вставити в SQL Editor
4. Натиснути **Run**
5. Перевірити: **Success. No rows returned**

✅ **Перевірка**: Table Editor → повинно бути 9 таблиць:
- users
- hours
- processes
- levels
- objects
- process_types
- assignments
- additional_works
- materials

---

## Крок 3: Отримати API Keys (1 хвилина)

1. Supabase Dashboard → **Settings** (⚙️) → **API**
2. Знайти секцію **Project API keys**
3. Скопіювати:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## Крок 4: Додати Env Змінні

### Для Vercel (Production):

1. Vercel Dashboard → ваш проект → **Settings** → **Environment Variables**
2. **Add new**:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Environments**: Production, Preview, Development
3. **Add new**:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Environments**: Production, Preview, Development
4. **Save**
5. **Redeploy** проект

### Для Локальної Розробки:

1. Відкрити файл `/app/.env.local`
2. Замінити placeholder'и на реальні значення:

```env
# SUPABASE CONFIGURATION (Primary Database)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. Зберегти файл
4. Перезапустити dev сервер:
```bash
npm run dev
```

---

## Крок 5: Перевірити (1 хвилина)

### Перевірка в Console:

1. Відкрити додаток в браузері
2. Відкрити Developer Tools (F12)
3. Console → шукати:

```
[DataAdapter] Active data source: supabase
[DataContext] Loading fresh data from supabase
```

✅ **Якщо бачите "supabase"** - все працює!

❌ **Якщо бачите "googlesheets"** - env змінні не встановлені або неправильні

### Перевірка в Supabase:

1. Supabase Dashboard → **Table Editor** → **users**
2. Спробувати зареєструвати нового користувача в додатку
3. Перевірити чи з'явився запис в таблиці

---

## Крок 6: Додати Тестового Користувача (Опціонально)

Якщо хочете протестувати з існуючим користувачем:

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Вставити:

```sql
-- Створити менеджера
INSERT INTO users (id, name, role, level, hourly_rate, telegram_id)
VALUES ('123456789', 'Тестовий Менеджер', 'manager', 'Senior', 250, '123456789');

-- Створити працівника
INSERT INTO users (id, name, role, level, hourly_rate, manager_id, telegram_id)
VALUES ('987654321', 'Тестовий Працівник', 'employee', 'Junior', 150, '123456789', '987654321');

-- Створити level
INSERT INTO levels (id, name, hourly_rate)
VALUES ('1', 'Junior', 150), ('2', 'Middle', 200), ('3', 'Senior', 250);

-- Створити об'єкт
INSERT INTO objects (id, name, max_hours)
VALUES ('1', 'Тестовий Об''єкт', 160);
```

3. **Run**
4. Тепер можна логінитися з ID: `987654321`

---

## ⚡ Troubleshooting

### Помилка: "Failed to fetch" або "Network error"

**Причина**: Неправильний URL або CORS

**Рішення**:
1. Перевірити `VITE_SUPABASE_URL` (має бути `https://xxx.supabase.co`)
2. Перезапустити dev сервер
3. Hard refresh (Ctrl+Shift+R)

### Помилка: "Invalid API key"

**Причина**: Неправильний anon key

**Рішення**:
1. Скопіювати ключ з Supabase Dashboard → Settings → API
2. Має починатися з `eyJhbGc...`
3. Оновити env змінну
4. Перезапустити сервер

### Помилка: "Row not found" або "No data"

**Причина**: RLS блокує доступ

**Рішення**:
1. Перевірити що міграція 002 виконана
2. Додати користувача в БД (див. Крок 6)
3. Тимчасово вимкнути RLS для тестування:
```sql
ALTER TABLE hours DISABLE ROW LEVEL SECURITY;
```

### Env змінні не працюють

**Причина**: Vite кешує env змінні

**Рішення**:
1. Зупинити dev сервер (Ctrl+C)
2. Видалити `.env.local` якщо є помилки
3. Створити заново
4. Запустити: `npm run dev`
5. Hard refresh в браузері

---

## 📊 Очікувані Результати

### Після Налаштування:

✅ Console показує: `Active data source: supabase`
✅ Дані завантажуються швидко (~100-200ms)
✅ CRUD операції працюють
✅ Користувачі бачать тільки свої дані
✅ Менеджери бачать дані команди

### Продуктивність:

| Операція | Google Sheets | Supabase |
|----------|---------------|----------|
| Завантаження | ~2-3 сек | ~100-200 мс |
| Створення запису | ~1-2 сек | ~50-100 мс |
| Оновлення | ~1-2 сек | ~50-100 мс |
| Видалення | ~1 сек | ~50 мс |

**Результат**: Додаток працює **10-20x швидше!** ⚡

---

## 🎯 Що Далі?

### Міграція Даних (Опціонально):

Якщо є існуючі дані в Google Sheets:

1. Export з Google Sheets → CSV
2. Import в Supabase через Table Editor
3. Або залишити Google Sheets як backup

### Відключити Google Sheets (Опціонально):

Після повної міграції можна видалити Google Sheets env змінні:

```env
# Видалити ці рядки з .env.local
# VITE_GOOGLE_API_KEY=...
# VITE_SPREADSHEET_ID=...
# VITE_GOOGLE_SCRIPT_URL=...
```

Додаток буде працювати тільки з Supabase.

---

## ✅ Чеклист

- [ ] Створити Supabase проект
- [ ] Виконати міграцію 001_initial_schema.sql
- [ ] Виконати міграцію 002_row_level_security.sql
- [ ] Скопіювати Project URL
- [ ] Скопіювати anon key
- [ ] Додати env змінні (Vercel)
- [ ] Додати env змінні (.env.local)
- [ ] Перезапустити dev сервер
- [ ] Перевірити console: "supabase"
- [ ] Створити тестового користувача
- [ ] Протестувати CRUD операції
- [ ] Redeploy на Vercel
- [ ] Перевірити production

---

**Готово!** Тепер ваш додаток працює на Supabase! 🚀

Якщо виникнуть проблеми:
- Перевірити console на помилки
- Переглянути Supabase Dashboard → Logs
- Читати SUPABASE_MIGRATION_COMPLETE.md для детальної інформації
