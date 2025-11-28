-- ШВИДКЕ ВИПРАВЛЕННЯ: Дозволити всі операції для всіх таблиць
-- Виконайте в Supabase SQL Editor: https://app.supabase.com/project/zdfogogoqnsdinjxkdtl/sql

-- Видаляємо всі старі політики та створюємо нові що дозволяють все

-- USERS
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can read managed employees" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "All users can read all users" ON users;
DROP POLICY IF EXISTS "Allow user self-registration" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- OBJECTS
DROP POLICY IF EXISTS "All users can read objects" ON objects;
CREATE POLICY "Allow all on objects" ON objects FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- PROCESS_TYPES
DROP POLICY IF EXISTS "All users can read process types" ON process_types;
CREATE POLICY "Allow all on process_types" ON process_types FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- HOURS
DROP POLICY IF EXISTS "Users can read own hours" ON hours;
DROP POLICY IF EXISTS "Managers can read team hours" ON hours;
DROP POLICY IF EXISTS "Users can insert own hours" ON hours;
DROP POLICY IF EXISTS "Users can update own hours" ON hours;
DROP POLICY IF EXISTS "Users can delete own hours" ON hours;
CREATE POLICY "Allow all on hours" ON hours FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- PROCESSES
DROP POLICY IF EXISTS "Users can read own processes" ON processes;
DROP POLICY IF EXISTS "Managers can read team processes" ON processes;
DROP POLICY IF EXISTS "Users can insert own processes" ON processes;
DROP POLICY IF EXISTS "Users can update own processes" ON processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON processes;
CREATE POLICY "Allow all on processes" ON processes FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- MATERIALS
DROP POLICY IF EXISTS "Users can read own materials" ON materials;
DROP POLICY IF EXISTS "Managers can read team materials" ON materials;
DROP POLICY IF EXISTS "Users can insert own materials" ON materials;
DROP POLICY IF EXISTS "Users can update own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON materials;
CREATE POLICY "Allow all on materials" ON materials FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ASSIGNMENTS
DROP POLICY IF EXISTS "Employees can read own assignments" ON assignments;
DROP POLICY IF EXISTS "Managers can read own assignments" ON assignments;
DROP POLICY IF EXISTS "Managers can insert assignments" ON assignments;
DROP POLICY IF EXISTS "Managers can update own assignments" ON assignments;
DROP POLICY IF EXISTS "Employees can update assigned tasks" ON assignments;
CREATE POLICY "Allow all on assignments" ON assignments FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- ADDITIONAL_WORKS
DROP POLICY IF EXISTS "Users can read own additional works" ON additional_works;
DROP POLICY IF EXISTS "Managers can read team additional works" ON additional_works;
DROP POLICY IF EXISTS "Users can insert own additional works" ON additional_works;
DROP POLICY IF EXISTS "Managers can update additional works" ON additional_works;
CREATE POLICY "Allow all on additional_works" ON additional_works FOR ALL USING (TRUE) WITH CHECK (TRUE);
