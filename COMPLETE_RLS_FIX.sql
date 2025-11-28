-- ============================================================
-- ПОВНЕ ВИПРАВЛЕННЯ RLS ПОЛІТИК
-- Дозволяє всі операції для всіх користувачів
-- ============================================================
-- Виконайте цей SQL в Supabase SQL Editor:
-- https://app.supabase.com/project/zdfogogoqnsdinjxkdtl/sql

-- ============================================================
-- 1. USERS - Користувачі
-- ============================================================
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read managed employees" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "All users can read all users" ON users;
DROP POLICY IF EXISTS "Allow user self-registration" ON users;

CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 2. LEVELS - Рівні (тільки читання, дані керуються адміністратором)
-- ============================================================
DROP POLICY IF EXISTS "All users can read levels" ON levels;
CREATE POLICY "Allow read levels" ON levels FOR SELECT USING (TRUE);

-- ============================================================
-- 3. OBJECTS - Об'єкти
-- ============================================================
DROP POLICY IF EXISTS "All users can read objects" ON objects;
CREATE POLICY "Allow all operations on objects" ON objects FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 4. PROCESS_TYPES - Типи процесів
-- ============================================================
DROP POLICY IF EXISTS "All users can read process types" ON process_types;
CREATE POLICY "Allow all operations on process_types" ON process_types FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 5. HOURS - Години роботи
-- ============================================================
DROP POLICY IF EXISTS "Users can read own hours" ON hours;
DROP POLICY IF EXISTS "Managers can read team hours" ON hours;
DROP POLICY IF EXISTS "Users can insert own hours" ON hours;
DROP POLICY IF EXISTS "Users can update own hours" ON hours;
DROP POLICY IF EXISTS "Users can delete own hours" ON hours;

CREATE POLICY "Allow all operations on hours" ON hours FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 6. PROCESSES - Процеси
-- ============================================================
DROP POLICY IF EXISTS "Users can read own processes" ON processes;
DROP POLICY IF EXISTS "Managers can read team processes" ON processes;
DROP POLICY IF EXISTS "Users can insert own processes" ON processes;
DROP POLICY IF EXISTS "Users can update own processes" ON processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON processes;

CREATE POLICY "Allow all operations on processes" ON processes FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 7. MATERIALS - Матеріали
-- ============================================================
DROP POLICY IF EXISTS "Users can read own materials" ON materials;
DROP POLICY IF EXISTS "Managers can read team materials" ON materials;
DROP POLICY IF EXISTS "Users can insert own materials" ON materials;
DROP POLICY IF EXISTS "Users can update own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON materials;

CREATE POLICY "Allow all operations on materials" ON materials FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 8. ASSIGNMENTS - Завдання
-- ============================================================
DROP POLICY IF EXISTS "Employees can read own assignments" ON assignments;
DROP POLICY IF EXISTS "Managers can read own assignments" ON assignments;
DROP POLICY IF EXISTS "Managers can insert assignments" ON assignments;
DROP POLICY IF EXISTS "Managers can update own assignments" ON assignments;
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON assignments;

CREATE POLICY "Allow all operations on assignments" ON assignments FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- 9. ADDITIONAL_WORKS - Додаткові роботи
-- ============================================================
DROP POLICY IF EXISTS "Users can read own additional works" ON additional_works;
DROP POLICY IF EXISTS "Managers can read team additional works" ON additional_works;
DROP POLICY IF EXISTS "Users can insert own additional works" ON additional_works;
DROP POLICY IF EXISTS "Managers can update additional works" ON additional_works;

CREATE POLICY "Allow all operations on additional_works" ON additional_works FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ============================================================
-- ПЕРЕВІРКА: Показати всі активні політики
-- ============================================================
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual = 'true' THEN '✅ ДОЗВОЛЕНО'
    ELSE '⚠️ ОБМЕЖЕНО'
  END as access_level
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- ТЕСТ: Перевірка можливості вставки
-- ============================================================
DO $$
DECLARE
  test_id TEXT := 'test_' || extract(epoch from now())::text;
  success_count INT := 0;
BEGIN
  -- Тест 1: Users
  BEGIN
    INSERT INTO users (id, name, role, level, hourly_rate)
    VALUES (test_id, 'Тест', 'employee', 'Стажер', 150);
    DELETE FROM users WHERE id = test_id;
    success_count := success_count + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Users: %', SQLERRM;
  END;

  -- Тест 2: Objects
  BEGIN
    INSERT INTO objects (id, name, max_hours)
    VALUES (test_id, 'Тест Об''єкт', 160);
    DELETE FROM objects WHERE id = test_id;
    success_count := success_count + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Objects: %', SQLERRM;
  END;

  -- Тест 3: Process Types
  BEGIN
    INSERT INTO process_types (id, name, unit, rate)
    VALUES (test_id, 'Тест Процес', 'м²', 10);
    DELETE FROM process_types WHERE id = test_id;
    success_count := success_count + 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Process Types: %', SQLERRM;
  END;

  RAISE NOTICE '✅ Успішних тестів: % з 3', success_count;

  IF success_count = 3 THEN
    RAISE NOTICE '🎉 ВСЕ ПРАЦЮЄ! Всі операції дозволені.';
  END IF;
END $$;
