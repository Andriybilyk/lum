-- Спрощуємо RLS політики, оскільки додаток не використовує Supabase Auth
-- Фільтрація по підрозділах буде на рівні застосунку
-- Це тимчасове рішення до впровадження повноцінної Supabase Auth

-- ============================================
-- USERS
-- ============================================
DROP POLICY IF EXISTS "Users can view users in their department" ON users;
CREATE POLICY "Authenticated users can view all users"
  ON users
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Users can insert users" ON users;
CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update users" ON users;
CREATE POLICY "Anyone can update users"
  ON users
  FOR UPDATE
  TO public
  USING (true);

-- ============================================
-- LEVELS
-- ============================================
DROP POLICY IF EXISTS "Users can view levels in their department" ON levels;
DROP POLICY IF EXISTS "Managers can insert levels in their department" ON levels;
DROP POLICY IF EXISTS "Managers can update levels in their department" ON levels;
DROP POLICY IF EXISTS "Managers can delete levels in their department" ON levels;

CREATE POLICY "Anyone can view levels"
  ON levels
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert levels"
  ON levels
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update levels"
  ON levels
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete levels"
  ON levels
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- OBJECTS
-- ============================================
DROP POLICY IF EXISTS "Users can view objects in their department" ON objects;
DROP POLICY IF EXISTS "Managers can insert objects in their department" ON objects;
DROP POLICY IF EXISTS "Managers can update objects in their department" ON objects;
DROP POLICY IF EXISTS "Managers can delete objects in their department" ON objects;

CREATE POLICY "Anyone can view objects"
  ON objects
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert objects"
  ON objects
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update objects"
  ON objects
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete objects"
  ON objects
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- PROCESS_TYPES
-- ============================================
DROP POLICY IF EXISTS "Users can view process_types in their department" ON process_types;
DROP POLICY IF EXISTS "Managers can insert process_types in their department" ON process_types;
DROP POLICY IF EXISTS "Managers can update process_types in their department" ON process_types;
DROP POLICY IF EXISTS "Managers can delete process_types in their department" ON process_types;

CREATE POLICY "Anyone can view process_types"
  ON process_types
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert process_types"
  ON process_types
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update process_types"
  ON process_types
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete process_types"
  ON process_types
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- HOURS
-- ============================================
DROP POLICY IF EXISTS "Users can view hours in their department" ON hours;
DROP POLICY IF EXISTS "Users can insert their own hours" ON hours;
DROP POLICY IF EXISTS "Users can update their own hours" ON hours;
DROP POLICY IF EXISTS "Users can delete their own hours" ON hours;

CREATE POLICY "Anyone can view hours"
  ON hours
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert hours"
  ON hours
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update hours"
  ON hours
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete hours"
  ON hours
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- PROCESSES
-- ============================================
DROP POLICY IF EXISTS "Users can view processes in their department" ON processes;
DROP POLICY IF EXISTS "Users can insert their own processes" ON processes;
DROP POLICY IF EXISTS "Users can update their own processes" ON processes;
DROP POLICY IF EXISTS "Users can delete their own processes" ON processes;

CREATE POLICY "Anyone can view processes"
  ON processes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert processes"
  ON processes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update processes"
  ON processes
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete processes"
  ON processes
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- MATERIALS
-- ============================================
DROP POLICY IF EXISTS "Users can view materials in their department" ON materials;
DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;

CREATE POLICY "Anyone can view materials"
  ON materials
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert materials"
  ON materials
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update materials"
  ON materials
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete materials"
  ON materials
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- WORK_PHOTOS
-- ============================================
DROP POLICY IF EXISTS "Users can view work_photos in their department" ON work_photos;
DROP POLICY IF EXISTS "Users can view their own work photos" ON work_photos;
DROP POLICY IF EXISTS "Managers can view their employees work photos" ON work_photos;

CREATE POLICY "Anyone can view work_photos"
  ON work_photos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert work_photos"
  ON work_photos
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update work_photos"
  ON work_photos
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete work_photos"
  ON work_photos
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- ASSIGNMENTS
-- ============================================
DROP POLICY IF EXISTS "Users can view assignments in their department" ON assignments;

CREATE POLICY "Anyone can view assignments"
  ON assignments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert assignments"
  ON assignments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update assignments"
  ON assignments
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete assignments"
  ON assignments
  FOR DELETE
  TO public
  USING (true);

-- ============================================
-- ADDITIONAL_WORKS
-- ============================================
DROP POLICY IF EXISTS "Users can view additional_works in their department" ON additional_works;

CREATE POLICY "Anyone can view additional_works"
  ON additional_works
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert additional_works"
  ON additional_works
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update additional_works"
  ON additional_works
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete additional_works"
  ON additional_works
  FOR DELETE
  TO public
  USING (true);

-- Коментарі
COMMENT ON TABLE users IS 'RLS спрощено - фільтрація по department_id на рівні застосунку';
COMMENT ON TABLE levels IS 'RLS спрощено - фільтрація по department_id на рівні застосунку';
COMMENT ON TABLE objects IS 'RLS спрощено - фільтрація по department_id на рівні застосунку';
COMMENT ON TABLE process_types IS 'RLS спрощено - фільтрація по department_id на рівні застосунку';
