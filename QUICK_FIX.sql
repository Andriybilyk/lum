-- ШВИДКЕ ВИПРАВЛЕННЯ: Виконайте цей SQL в Supabase SQL Editor
-- https://app.supabase.com/project/zdfogogoqnsdinjxkdtl/sql

-- Видаляємо старі політики
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read managed employees" ON users;

-- Дозволяємо читати всіх користувачів
CREATE POLICY "All users can read all users" ON users FOR SELECT USING (TRUE);

-- Дозволяємо створювати нових користувачів
CREATE POLICY "Allow user self-registration" ON users FOR INSERT WITH CHECK (TRUE);
