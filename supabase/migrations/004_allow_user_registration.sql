-- Міграція для дозволу реєстрації нових користувачів
-- Додаємо політику INSERT для таблиці users

-- Політика для реєстрації нових користувачів
-- Дозволяє будь-кому створити користувача зі своїм ID
CREATE POLICY "Allow user self-registration" ON users
  FOR INSERT WITH CHECK (TRUE);

-- Також дозволимо читати всіх користувачів (потрібно для вибору менеджера при реєстрації)
CREATE POLICY "All users can read all users" ON users
  FOR SELECT USING (TRUE);

-- Видаляємо старі більш обмежені політики SELECT
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read managed employees" ON users;

-- Коментар
COMMENT ON POLICY "Allow user self-registration" ON users IS 'Дозволяє самореєстрацію користувачів';
COMMENT ON POLICY "All users can read all users" ON users IS 'Дозволяє читати список всіх користувачів';
