-- ============================================================
-- ВИПРАВЛЕННЯ: Дозвіл реєстрації нових користувачів
-- ============================================================
-- Скопіюйте цей SQL і виконайте в Supabase SQL Editor
-- https://app.supabase.com/project/zdfogogoqnsdinjxkdtl/sql

-- 1. Видаляємо старі обмежені політики SELECT
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read managed employees" ON users;

-- 2. Додаємо нову політику для читання всіх користувачів
-- (потрібно для вибору менеджера при реєстрації та перегляду списку працівників)
CREATE POLICY "All users can read all users" ON users
  FOR SELECT USING (TRUE);

-- 3. Додаємо політику для реєстрації нових користувачів
-- Дозволяє будь-кому створити запис користувача
CREATE POLICY "Allow user self-registration" ON users
  FOR INSERT WITH CHECK (TRUE);

-- 4. Перевірка: показати всі активні політики для таблиці users
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 5. Тестовий запит: спроба вставити і відразу видалити тестового користувача
DO $$
DECLARE
  test_id TEXT := 'test_' || extract(epoch from now())::text;
BEGIN
  -- Вставка тестового користувача
  INSERT INTO users (id, name, role, level, hourly_rate, telegram_id)
  VALUES (test_id, 'Тест', 'employee', 'Стажер', 150, test_id);

  -- Видалення тестового користувача
  DELETE FROM users WHERE id = test_id;

  RAISE NOTICE '✅ Тест пройдено успішно! Реєстрація працює.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Помилка: %', SQLERRM;
END $$;
