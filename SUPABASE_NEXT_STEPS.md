# 🎯 Наступні Кроки для Повного Переходу на Supabase

## ✅ Що Вже Готово

- ✅ Data Adapter створено і інтегровано
- ✅ DataContext оновлено для Supabase
- ✅ UserContext налаштовано для RLS
- ✅ SQL міграції підготовлені
- ✅ TypeScript типи створені
- ✅ Supabase service layer готовий
- ✅ Документація написана

## 🔴 Що Потрібно Зробити ЗАРАЗ

### Крок 1: Створити Supabase Проект (5 хвилин)

**Найпростіший спосіб - через Vercel:**

1. Відкрити https://vercel.com/dashboard
2. Вибрати ваш проект (time-tracker)
3. Вкладка **Storage**
4. Натиснути **Create Database**
5. Вибрати **Supabase**
6. Натиснути **Create**
7. Vercel автоматично:
   - Створить Supabase проект
   - Додасть env змінні автоматично
   - Зв'яже проекти

✅ **Після цього env змінні будуть автоматично в Vercel!**

**Альтернатива - вручну:**

1. Перейти на https://app.supabase.com
2. Натиснути **New Project**
3. Заповнити:
   - Name: `time-tracker`
   - Database Password: створити надійний пароль (**зберегти його!**)
   - Region: Europe (Frankfurt) або найближчий
4. Натиснути **Create new project**
5. Почекати 2-3 хвилини поки проект створюється

---

### Крок 2: Виконати SQL Міграції (3 хвилини)

#### Міграція 1: Створити Таблиці

1. В Supabase Dashboard → **SQL Editor** (ліворуч в меню)
2. Натиснути **New query**
3. Відкрити файл `/app/supabase/migrations/001_initial_schema.sql`
4. Скопіювати **ВЕСЬ** вміст файлу
5. Вставити в SQL Editor
6. Натиснути **Run** (або Ctrl+Enter)
7. Дочекатися: "Success. No rows returned"

✅ Це створить:
- 9 таблиць (users, hours, processes, levels, objects, process_types, assignments, additional_works, materials)
- Індекси для швидкості
- Foreign keys для цілісності
- Triggers для auto-update

#### Міграція 2: Налаштувати Row Level Security

1. **New query** в SQL Editor
2. Відкрити файл `/app/supabase/migrations/002_row_level_security.sql`
3. Скопіювати **ВЕСЬ** вміст
4. Вставити в SQL Editor
5. Натиснути **Run**
6. Дочекатися: "Success. No rows returned"

✅ Це створить:
- RLS policies для всіх таблиць
- Функцію `set_current_user_id()` для встановлення контексту
- Політики для користувачів та менеджерів

**Перевірка:**
- SQL Editor → Table Editor
- Повинно бути 9 таблиць

---

### Крок 3: Отримати API Credentials (1 хвилина)

1. Supabase Dashboard → **Settings** (⚙️ внизу зліва) → **API**
2. В секції **Project API keys** знайти:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Скопіювати обидва значення

---

### Крок 4A: Налаштувати для Vercel (Production)

1. Vercel Dashboard → ваш проект → **Settings** → **Environment Variables**

2. Якщо використовували Vercel Integration - змінні вже додані автоматично!

3. Якщо створювали вручну - додати:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: `https://xxxxxxxxxxxxx.supabase.co`
   - **Environments**: ✓ Production ✓ Preview ✓ Development
   - Натиснути **Save**

4. Додати другу змінну:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGc...` (довгий ключ)
   - **Environments**: ✓ Production ✓ Preview ✓ Development
   - Натиснути **Save**

5. **Deployments** → знайти останній deploy → **...** → **Redeploy**

---

### Крок 4B: Налаштувати Локально (Development)

1. Відкрити файл `/app/.env.local`

2. Замінити placeholder'и на реальні значення:

```env
# SUPABASE CONFIGURATION (Primary Database)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTc2MDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LEGACY: Google Sheets (Fallback - можна залишити для backup)
VITE_GOOGLE_API_KEY=...
VITE_SPREADSHEET_ID=...
VITE_GOOGLE_SCRIPT_URL=...
```

3. Зберегти файл

4. Перезапустити dev сервер:
```bash
# Ctrl+C щоб зупинити
npm run dev
```

5. Перевірити налаштування:
```bash
node check-supabase.cjs
```

Має показати:
```
✅ Supabase URL: https://xxxxxxxxxxxxx.supabase.co
✅ Supabase Anon Key: eyJhbGc...
```

---

### Крок 5: Перевірити Підключення (1 хвилина)

1. Відкрити додаток в браузері: `http://localhost:5173`

2. Відкрити Developer Tools (F12)

3. Вкладка **Console**

4. Шукати повідомлення:
```
[DataAdapter] Active data source: supabase
[DataContext] Loading fresh data from supabase
[DataContext] ✅ All data loaded successfully from supabase
```

✅ **Якщо бачите "supabase"** - все працює!

❌ **Якщо бачите "googlesheets"** - перевірити:
- Чи правильно вставлені env змінні
- Чи перезапущено dev сервер
- Чи немає помилок в console

---

### Крок 6: Створити Першого Користувача (2 хвилини)

**Варіант A: Через UI (рекомендовано)**

1. Відкрити додаток
2. Спробувати зареєструватися як новий користувач
3. Заповнити форму реєстрації
4. Додаток автоматично створить запис в Supabase

**Варіант B: Через SQL (якщо UI не працює)**

1. Supabase Dashboard → SQL Editor → New query
2. Вставити:

```sql
-- Створити рівні (levels)
INSERT INTO levels (id, name, hourly_rate) VALUES
('1', 'Junior', 150),
('2', 'Middle', 200),
('3', 'Senior', 250),
('4', 'Lead', 300);

-- Створити об'єкти
INSERT INTO objects (id, name, max_hours) VALUES
('1', 'Тестовий Об''єкт A', 160),
('2', 'Тестовий Об''єкт B', 160);

-- Створити менеджера
INSERT INTO users (id, name, role, level, hourly_rate, telegram_id) VALUES
('123456789', 'Тестовий Менеджер', 'manager', 'Senior', 250, '123456789');

-- Створити працівника
INSERT INTO users (id, name, role, level, hourly_rate, manager_id, telegram_id) VALUES
('987654321', 'Тестовий Працівник', 'employee', 'Junior', 150, '123456789', '987654321');
```

3. Run
4. Тепер можна логінитися з telegram_id: `987654321`

---

### Крок 7: Протестувати CRUD Операції (5 хвилин)

Зайти в додаток і протестувати:

- ✅ **Створення**: Додати запис годин → перевірити в Supabase Table Editor
- ✅ **Читання**: Відкрити звіти → дані завантажуються з Supabase
- ✅ **Оновлення**: Редагувати запис → зміни збережені в Supabase
- ✅ **Видалення**: Видалити запис → видалено з Supabase

**Перевірка в Supabase:**
- Table Editor → вибрати таблицю (hours, processes, materials)
- Бачити нові записи в реальному часі

---

## 🎉 Готово!

Після виконання всіх кроків:

### Локально (Development):
✅ Додаток працює з Supabase
✅ Швидкість 10-20x краще
✅ RLS працює
✅ CRUD операції працюють

### Production (Vercel):
✅ Env змінні налаштовані
✅ Додаток deploy'єний
✅ Користувачі бачать тільки свої дані
✅ Менеджери бачать дані команди

---

## 🔧 Troubleshooting

### "Active data source: googlesheets"

**Проблема**: Env змінні не підхоплені

**Рішення**:
```bash
# Перевірити
node check-supabase.cjs

# Якщо не проходить - перевірити .env.local
cat .env.local

# Перезапустити dev сервер
npm run dev

# Hard refresh в браузері
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### "Failed to fetch" або Network Error

**Проблема**: Неправильний URL або CORS

**Рішення**:
1. Перевірити URL в .env.local
2. Має бути `https://xxx.supabase.co` (з https://)
3. Перевірити в Supabase Dashboard → Settings → API

### "Row not found" або "No data"

**Проблема**: RLS блокує доступ

**Рішення**:
1. Додати користувача в БД (див. Крок 6)
2. Перевірити що `set_current_user_id()` викликається
3. Тимчасово вимкнути RLS для діагностики:
```sql
-- Тільки для тестування!
ALTER TABLE hours DISABLE ROW LEVEL SECURITY;
ALTER TABLE processes DISABLE ROW LEVEL SECURITY;
```

### Env змінні не працюють

**Рішення**:
```bash
# Видалити node_modules/.vite
rm -rf node_modules/.vite

# Перезапустити
npm run dev
```

---

## 📊 Очікувана Продуктивність

### До (Google Sheets):
- 🐌 Завантаження: ~2-3 секунди
- 🐌 Створення запису: ~1-2 секунди
- 🐌 Concurrent users: обмежено

### Після (Supabase):
- ⚡ Завантаження: ~100-200 мілісекунд
- ⚡ Створення запису: ~50-100 мілісекунд
- ⚡ Concurrent users: необмежено

**Результат: 10-20x швидше!**

---

## 📞 Підтримка

Якщо виникнуть питання:

1. Перевірити console в браузері (F12)
2. Переглянути Supabase Dashboard → Logs
3. Читати SUPABASE_MIGRATION_COMPLETE.md
4. Читати QUICK_SUPABASE_SETUP.md

---

**Готово до міграції!** Всі інструменти та інструкції підготовлені.

Час виконання: **~15 хвилин**
Складність: **🟢 Легко**

🚀 **Let's go!**
