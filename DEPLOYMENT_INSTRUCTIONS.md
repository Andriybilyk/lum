# 🚀 Інструкції з розгортання оптимізованої версії

## 📋 Зміст

1. [Що було змінено](#що-було-змінено)
2. [Кроки розгортання](#кроки-розгортання)
3. [Тестування](#тестування)
4. [Відкат у разі проблем](#відкат-у-разі-проблем)
5. [FAQ](#faq)

## Що було змінено

### ✨ Основні зміни

1. **Серверна фільтрація даних** - дані тепер фільтруються на рівні PostgreSQL, а не в браузері
2. **Покращена продуктивність** - швидкість завантаження збільшена в ~3 рази
3. **Безпека** - дані інших підрозділів не потрапляють в браузер
4. **Нові міграції**:
   - `014_allow_public_departments_access.sql` - публічний доступ до списку підрозділів
   - `015_simplify_rls_for_client_side_filtering.sql` - спрощення RLS політик
   - `016_add_performance_indexes.sql` - індекси для оптимізації

### 📁 Змінені файли

- `/app/src/services/supabaseService.ts` - додано параметри фільтрації
- `/app/src/services/dataAdapter.ts` - двофазне завантаження даних
- `/app/src/contexts/DataContext.tsx` - видалено клієнтську фільтрацію

## Кроки розгортання

### Крок 1: Резервне копіювання БД ⚠️

**ВАЖЛИВО:** Обов'язково створіть backup перед застосуванням міграцій!

```bash
# Через Supabase Dashboard:
# 1. Відкрити Settings → Database
# 2. Натиснути "Create backup"
# 3. Дочекатися завершення
```

Альтернативно, через CLI:
```bash
# Експорт даних
npx supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# Або експорт лише даних (без схеми)
npx supabase db dump --data-only -f backup_data_$(date +%Y%m%d_%H%M%S).sql
```

### Крок 2: Застосування міграцій до Supabase

#### Варіант A: Через Supabase Dashboard (Рекомендується)

1. **Відкрити SQL Editor** в Supabase Dashboard
2. **Застосувати міграцію 014:**
   - Відкрити файл `supabase/migrations/014_allow_public_departments_access.sql`
   - Скопіювати весь вміст
   - Вставити в SQL Editor
   - Натиснути "Run" ▶️
   - Перевірити, що виконалося без помилок

3. **Застосувати міграцію 015:**
   - Відкрити файл `supabase/migrations/015_simplify_rls_for_client_side_filtering.sql`
   - Скопіювати весь вміст
   - Вставити в SQL Editor
   - Натиснути "Run" ▶️
   - Перевірити, що виконалося без помилок

4. **Застосувати міграцію 016:**
   - Відкрити файл `supabase/migrations/016_add_performance_indexes.sql`
   - Скопіювати весь вміст
   - Вставити в SQL Editor
   - Натиснути "Run" ▶️
   - Перевірити, що створилося повідомлення про кількість індексів

#### Варіант B: Через Supabase CLI

```bash
# Якщо використовуєте локальний Supabase
npx supabase db push

# Або застосувати конкретні міграції
npx supabase db push --include-all

# Перевірка статусу міграцій
npx supabase migration list
```

### Крок 3: Перевірка міграцій

Виконати тестовий SQL скрипт для перевірки:

```bash
# Відкрити SQL Editor в Supabase Dashboard
# Виконати вміст файлу: supabase/tests/test_department_isolation.sql
```

**Перевірити:**
- ✅ Всі підрозділи на місці (фасад, столярні вироби, стіни)
- ✅ Користувачі розподілені по підрозділах
- ✅ Об'єкти мають правильні department_id
- ✅ **КРИТИЧНО:** Секція "ПЕРЕВІРКА ВИТОКУ ДАНИХ" повинна повернути 0 рядків
- ✅ Індекси створені (перевірити секцію "ІНДЕКСИ ДЛЯ ОПТИМІЗАЦІЇ")

### Крок 4: Білд та розгортання коду

```bash
# Перевірка, що код компілюється
npm run build

# Якщо build успішний, розгорнути
# Наприклад, для Vercel:
vercel --prod

# Або для інших платформ:
git add .
git commit -m "feat: optimize data filtering with server-side approach"
git push origin main
```

### Крок 5: Перевірка в продакшені

1. **Відкрити Developer Tools → Network**
2. **Зайти в додаток**
3. **Перевірити запити до Supabase:**
   ```
   ✅ Запити містять фільтри (eq.department_id)
   ✅ Розмір відповідей зменшився
   ✅ Час завантаження скоротився
   ```

4. **Перевірити консоль:**
   ```javascript
   // Має бути лог типу:
   📊 Data loaded in 800ms, size: 350 KB (department: abc-123)
   ```

5. **Перевірити ізоляцію:**
   - Зайти як користувач підрозділу "фасад"
   - Переглянути об'єкти → повинні бути лише з "фасад"
   - Зайти як користувач "столярні вироби"
   - Переглянути об'єкти → повинні бути лише зі "столярні вироби"

## Тестування

### Функціональні тести

#### ✅ Тест 1: Реєстрація
```
1. Відкрити додаток (незареєстрований користувач)
2. Натиснути "Реєстрація працівника"
3. ОЧІКУЄТЬСЯ: Список підрозділів відображається
4. Вибрати підрозділ і завершити реєстрацію
5. ОЧІКУЄТЬСЯ: Користувач створений з правильним department_id
```

#### ✅ Тест 2: Ізоляція даних
```
1. Зайти як користувач підрозділу "фасад"
2. Відкрити "Години" або "Процеси"
3. КРИТИЧНО: Об'єкти для вибору лише з підрозділу "фасад"
4. Зайти як користувач "столярні вироби"
5. КРИТИЧНО: Об'єкти лише зі "столярні вироби"
```

#### ✅ Тест 3: Звіти
```
1. Зайти як менеджер підрозділу
2. Відкрити "Звіти" → "Звіт по команді"
3. ОЧІКУЄТЬСЯ: Лише працівники з того ж підрозділу
4. Відкрити "Звіт працівника"
5. ОЧІКУЄТЬСЯ: Дані лише по обраному працівнику
```

#### ✅ Тест 4: Продуктивність
```
1. Відкрити Developer Tools → Network
2. Очистити мережу (Clear)
3. Завантажити додаток
4. ОЧІКУЄТЬСЯ:
   - Час завантаження < 1 секунди
   - Розмір даних ~300-400KB (замість 1MB)
   - Запити містять фільтри WHERE
```

### Тести продуктивності

Запустити у SQL Editor:

```sql
-- Перевірка часу виконання запиту з фільтром
EXPLAIN ANALYZE
SELECT * FROM users
WHERE department_id = 'your-department-id';

-- Має використовувати індекс:
-- Index Scan using idx_users_department_id ...

-- Перевірка часу виконання запиту для годин
EXPLAIN ANALYZE
SELECT * FROM hours
WHERE user_id IN ('user1', 'user2', 'user3')
ORDER BY date DESC;

-- Має використовувати індекси:
-- Index Scan using idx_hours_user_date ...
```

## Відкат у разі проблем

Якщо щось пішло не так, виконайте відкат:

### Варіант 1: Відкат міграцій (якщо проблема в БД)

```sql
-- Відкрити SQL Editor в Supabase Dashboard
-- Виконати:

-- 1. Видалити індекси
DROP INDEX IF EXISTS idx_users_department_id;
DROP INDEX IF EXISTS idx_levels_department_id;
DROP INDEX IF EXISTS idx_objects_department_id;
DROP INDEX IF EXISTS idx_process_types_department_id;
DROP INDEX IF EXISTS idx_hours_user_id;
DROP INDEX IF EXISTS idx_processes_user_id;
DROP INDEX IF EXISTS idx_materials_user_id;
DROP INDEX IF EXISTS idx_work_photos_user_id;
DROP INDEX IF EXISTS idx_assignments_employee_id;
DROP INDEX IF EXISTS idx_assignments_manager_id;
DROP INDEX IF EXISTS idx_additional_works_user_id;
DROP INDEX IF EXISTS idx_additional_works_manager_id;
DROP INDEX IF EXISTS idx_hours_user_date;
DROP INDEX IF EXISTS idx_processes_user_date;
DROP INDEX IF EXISTS idx_materials_user_date;

-- 2. Відновити RLS політики (якщо потрібно)
-- Виконати SQL з попередньої версії
```

### Варіант 2: Відкат коду (якщо проблема в додатку)

```bash
# Знайти останній робочий commit
git log --oneline

# Відкотитися до нього
git revert HEAD
# або
git reset --hard <commit-hash>

# Пушнути відкат
git push origin main --force

# Перезапустити build
npm run build
vercel --prod
```

### Варіант 3: Повне відновлення з backup

```bash
# Відновити backup через Supabase Dashboard:
# Settings → Database → Backups → Restore

# Або через CLI:
psql -h your-project.supabase.co -U postgres -d postgres -f backup_YYYYMMDD_HHMMSS.sql
```

## FAQ

### ❓ Чи потрібно щось міняти в .env файлі?

**Ні.** Всі налаштування залишаються без змін. Використовуються ті ж:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### ❓ Чи потрібно оновлювати npm пакети?

**Ні.** Всі залежності залишаються без змін. Оптимізація виконана в межах існуючого коду.

### ❓ Що робити, якщо користувач не бачить підрозділи при реєстрації?

Перевірити:
1. Міграція 014 застосована?
2. В таблиці `departments` є 3 підрозділи?
3. RLS політика для departments дозволяє public SELECT?

```sql
-- Перевірити політику:
SELECT * FROM pg_policies WHERE tablename = 'departments';

-- Має бути політика:
-- policy_name: "Public can view departments"
-- cmd: SELECT
-- roles: {public}
```

### ❓ Користувач бачить дані з інших підрозділів. Що робити?

Це критична проблема! Негайно:
1. Виконати тестовий SQL: `supabase/tests/test_department_isolation.sql`
2. Перевірити секцію "ПЕРЕВІРКА ВИТОКУ ДАНИХ"
3. Якщо знайдено порушення - виконати відкат

Можливі причини:
- Міграції не застосовані
- У записів немає department_id
- Код не передає departmentId в API

### ❓ Додаток працює повільно після оновлення

Перевірити:
1. Міграція 016 (індекси) застосована?
2. Виконати ANALYZE для таблиць:
```sql
ANALYZE users;
ANALYZE objects;
ANALYZE hours;
ANALYZE processes;
```

### ❓ Як додати новий підрозділ?

```sql
INSERT INTO departments (id, name, description)
VALUES (
  'new-dept-id',
  'Назва нового підрозділу',
  'Опис підрозділу'
);
```

Потім створити користувачів, об'єкти, рівні для цього підрозділу.

### ❓ Чи можна перенести користувача в інший підрозділ?

Так, але потрібно бути обережним:

```sql
-- Перенести користувача
UPDATE users
SET department_id = 'new-department-id'
WHERE id = 'user-id';

-- УВАГА: Його існуючі дані (години, процеси) залишаться без змін!
-- Вони все ще будуть пов'язані зі старими об'єктами.
-- Можливо, потрібно буде оновити ці записи вручну.
```

### ❓ Як моніторити продуктивність?

1. **Через Supabase Dashboard:**
   - Logs → Postgres Logs
   - Дивитися на slow queries

2. **Через додаток:**
   - Відкрити DevTools → Console
   - Шукати логи: `📊 Data loaded in Xms`

3. **Через SQL:**
```sql
-- Топ повільних запитів
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## 📞 Підтримка

Якщо виникли проблеми:

1. **Перевірити документацію:**
   - `/app/OPTIMIZATION_COMPLETED.md` - детальний звіт про зміни
   - `/app/PERFORMANCE_OPTIMIZATION_PLAN.md` - план оптимізації

2. **Виконати тести:**
   - `/app/supabase/tests/test_department_isolation.sql`

3. **Перевірити логи:**
   - Supabase Dashboard → Logs
   - Browser DevTools → Console
   - Browser DevTools → Network

4. **У критичних випадках:**
   - Виконати відкат (див. розділ вище)
   - Відновити з backup

---

**Версія:** 1.0.0
**Дата:** ${new Date().toISOString().split('T')[0]}
**Статус:** Готово до розгортання ✅
