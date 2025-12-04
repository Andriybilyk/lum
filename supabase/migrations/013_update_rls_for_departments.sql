-- Оновлюємо RLS політики для ізоляції підрозділів
-- Кожен користувач бачить тільки дані свого підрозділу

-- ============================================
-- USERS: Бачити тільки користувачів свого підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view users in their department" ON users;
CREATE POLICY "Users can view users in their department"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

-- ============================================
-- LEVELS: Бачити тільки рівні свого підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view levels in their department" ON levels;
CREATE POLICY "Users can view levels in their department"
  ON levels
  FOR SELECT
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can insert levels in their department" ON levels;
CREATE POLICY "Managers can insert levels in their department"
  ON levels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can update levels in their department" ON levels;
CREATE POLICY "Managers can update levels in their department"
  ON levels
  FOR UPDATE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can delete levels in their department" ON levels;
CREATE POLICY "Managers can delete levels in their department"
  ON levels
  FOR DELETE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

-- ============================================
-- OBJECTS: Бачити тільки об'єкти свого підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view objects in their department" ON objects;
CREATE POLICY "Users can view objects in their department"
  ON objects
  FOR SELECT
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can insert objects in their department" ON objects;
CREATE POLICY "Managers can insert objects in their department"
  ON objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can update objects in their department" ON objects;
CREATE POLICY "Managers can update objects in their department"
  ON objects
  FOR UPDATE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can delete objects in their department" ON objects;
CREATE POLICY "Managers can delete objects in their department"
  ON objects
  FOR DELETE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

-- ============================================
-- PROCESS_TYPES: Бачити тільки процеси свого підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view process_types in their department" ON process_types;
CREATE POLICY "Users can view process_types in their department"
  ON process_types
  FOR SELECT
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can insert process_types in their department" ON process_types;
CREATE POLICY "Managers can insert process_types in their department"
  ON process_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can update process_types in their department" ON process_types;
CREATE POLICY "Managers can update process_types in their department"
  ON process_types
  FOR UPDATE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Managers can delete process_types in their department" ON process_types;
CREATE POLICY "Managers can delete process_types in their department"
  ON process_types
  FOR DELETE
  TO authenticated
  USING (
    department_id = (
      SELECT department_id FROM users WHERE id = auth.uid()::text
    )
  );

-- ============================================
-- HOURS: Через user_id автоматично фільтрується по підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view hours in their department" ON hours;
CREATE POLICY "Users can view hours in their department"
  ON hours
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own hours" ON hours;
CREATE POLICY "Users can insert their own hours"
  ON hours
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own hours" ON hours;
CREATE POLICY "Users can update their own hours"
  ON hours
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own hours" ON hours;
CREATE POLICY "Users can delete their own hours"
  ON hours
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- ============================================
-- PROCESSES: Через user_id автоматично фільтрується по підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view processes in their department" ON processes;
CREATE POLICY "Users can view processes in their department"
  ON processes
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own processes" ON processes;
CREATE POLICY "Users can insert their own processes"
  ON processes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own processes" ON processes;
CREATE POLICY "Users can update their own processes"
  ON processes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own processes" ON processes;
CREATE POLICY "Users can delete their own processes"
  ON processes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- ============================================
-- MATERIALS: Через user_id автоматично фільтрується по підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view materials in their department" ON materials;
CREATE POLICY "Users can view materials in their department"
  ON materials
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert their own materials" ON materials;
CREATE POLICY "Users can insert their own materials"
  ON materials
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own materials" ON materials;
CREATE POLICY "Users can update their own materials"
  ON materials
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own materials" ON materials;
CREATE POLICY "Users can delete their own materials"
  ON materials
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- ============================================
-- WORK_PHOTOS: Через user_id автоматично фільтрується по підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view work_photos in their department" ON work_photos;
CREATE POLICY "Users can view work_photos in their department"
  ON work_photos
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
  );

DROP POLICY IF EXISTS "Users can view their own work photos" ON work_photos;
DROP POLICY IF EXISTS "Managers can view their employees work photos" ON work_photos;

-- ============================================
-- ASSIGNMENTS: Через employee_id/manager_id фільтрується по підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view assignments in their department" ON assignments;
CREATE POLICY "Users can view assignments in their department"
  ON assignments
  FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
    OR
    manager_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
  );

-- ============================================
-- ADDITIONAL_WORKS: Через user_id/manager_id фільтрується по підрозділу
-- ============================================
DROP POLICY IF EXISTS "Users can view additional_works in their department" ON additional_works;
CREATE POLICY "Users can view additional_works in their department"
  ON additional_works
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
    OR
    manager_id IN (
      SELECT id FROM users WHERE department_id = (
        SELECT department_id FROM users WHERE id = auth.uid()::text
      )
    )
  );

-- Коментарі
COMMENT ON POLICY "Users can view users in their department" ON users IS 'Користувачі бачать тільки користувачів свого підрозділу';
COMMENT ON POLICY "Users can view levels in their department" ON levels IS 'Рівні ізольовані по підрозділах';
COMMENT ON POLICY "Users can view objects in their department" ON objects IS 'Об''єкти ізольовані по підрозділах';
COMMENT ON POLICY "Users can view process_types in their department" ON process_types IS 'Процеси ізольовані по підрозділах';
