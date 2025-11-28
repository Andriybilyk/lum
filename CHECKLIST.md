# ✅ Чеклист Міграції на Supabase

## 📋 Швидкий Чеклист (15 хвилин)

### 1️⃣ Створити Supabase Проект

- [ ] Перейти на https://app.supabase.com або використати Vercel Integration
- [ ] Створити новий проект `time-tracker`
- [ ] Вибрати регіон: Europe (Frankfurt)
- [ ] Зберегти Database Password

**Час**: 2-3 хвилини

---

### 2️⃣ Виконати SQL Міграції

- [ ] Відкрити Supabase Dashboard → SQL Editor
- [ ] Скопіювати вміст `001_initial_schema.sql`
- [ ] Вставити в SQL Editor та Run
- [ ] Побачити "Success. No rows returned"
- [ ] Скопіювати вміст `002_row_level_security.sql`
- [ ] Вставити в SQL Editor та Run
- [ ] Побачити "Success. No rows returned"
- [ ] Перевірити Table Editor - 9 таблиць

**Файли**:
- `/app/supabase/migrations/001_initial_schema.sql`
- `/app/supabase/migrations/002_row_level_security.sql`

**Час**: 3 хвилини

---

### 3️⃣ Отримати API Credentials

- [ ] Settings → API
- [ ] Скопіювати **Project URL**: `https://xxx.supabase.co`
- [ ] Скопіювати **anon public** key: `eyJhbGc...`

**Час**: 1 хвилина

---

### 4️⃣ Налаштувати Локально

- [ ] Відкрити `/app/.env.local`
- [ ] Вставити `VITE_SUPABASE_URL=https://xxx.supabase.co`
- [ ] Вставити `VITE_SUPABASE_ANON_KEY=eyJhbGc...`
- [ ] Зберегти файл
- [ ] Запустити: `node check-supabase.cjs`
- [ ] Побачити: ✅ Supabase URL і ✅ Supabase Anon Key

**Час**: 2 хвилини

---

### 5️⃣ Перезапустити Dev Сервер

- [ ] Зупинити поточний сервер (Ctrl+C)
- [ ] Запустити: `npm run dev`
- [ ] Відкрити http://localhost:5173
- [ ] Відкрити Console (F12)
- [ ] Побачити: `[DataAdapter] Active data source: supabase`

**Час**: 1 хвилина

---

### 6️⃣ Створити Тестового Користувача

**Варіант A: Через UI**
- [ ] Відкрити додаток
- [ ] Спробувати зареєструватися
- [ ] Заповнити форму

**Варіант B: Через SQL**
- [ ] SQL Editor → New query
- [ ] Вставити SQL з `/app/SUPABASE_NEXT_STEPS.md` (Крок 6)
- [ ] Run
- [ ] Перевірити Table Editor → users

**Час**: 2 хвилини

---

### 7️⃣ Протестувати CRUD

- [ ] Додати запис годин → перевірити в Supabase
- [ ] Додати процес → перевірити в Supabase
- [ ] Додати матеріал → перевірити в Supabase
- [ ] Редагувати запис → перевірити зміни
- [ ] Видалити запис → перевірити видалення

**Час**: 3 хвилини

---

### 8️⃣ Налаштувати Vercel (Production)

- [ ] Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Додати `VITE_SUPABASE_URL`
- [ ] Додати `VITE_SUPABASE_ANON_KEY`
- [ ] Environments: ✓ Production ✓ Preview ✓ Development
- [ ] Redeploy проект

**Час**: 3 хвилини

---

### 9️⃣ Перевірити Production

- [ ] Відкрити production URL
- [ ] Відкрити Console
- [ ] Побачити: `Active data source: supabase`
- [ ] Спробувати CRUD операції
- [ ] Перевірити швидкість (має бути швидше!)

**Час**: 2 хвилини

---

## ✅ Успіх!

Якщо всі чекбокси ✓ - міграція завершена!

### Результат:

✅ Локальна розробка працює з Supabase
✅ Production працює з Supabase
✅ Швидкість покращена в 10-20 разів
✅ Row Level Security активна
✅ Дані захищені

---

## 🔧 Якщо Щось Не Працює

### Console показує "googlesheets"

```bash
# Перевірити env
node check-supabase.cjs

# Перезапустити
npm run dev

# Hard refresh
Ctrl + Shift + R
```

### "Failed to fetch"

1. Перевірити URL в `.env.local`
2. Має бути `https://xxx.supabase.co`
3. Перевірити в Supabase Dashboard → Settings → API

### "No data" або "Row not found"

1. Створити користувача в БД
2. Перевірити що RLS міграція виконана
3. Перевірити console на помилки

---

## 📚 Додаткова Інформація

- **Детальна інструкція**: `SUPABASE_NEXT_STEPS.md`
- **Швидке налаштування**: `QUICK_SUPABASE_SETUP.md`
- **Повна документація**: `SUPABASE_MIGRATION_COMPLETE.md`
- **Перевірка**: `node check-supabase.cjs`

---

**Загальний час**: ~15 хвилин
**Складність**: 🟢 Легко

Успіхів! 🚀
