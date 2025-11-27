-- Row Level Security policies
-- Migration: 002_row_level_security
-- This ensures users can only access their own data or data they manage

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE process_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_works ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Allow users to read their own data and their managed employees' data
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (
    id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can read managed employees" ON users
  FOR SELECT USING (
    manager_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    id = current_setting('app.current_user_id', TRUE)
  );

-- Levels policies (read-only for all authenticated users)
CREATE POLICY "All users can read levels" ON levels
  FOR SELECT USING (TRUE);

-- Objects policies (read-only for all authenticated users)
CREATE POLICY "All users can read objects" ON objects
  FOR SELECT USING (TRUE);

-- Process Types policies (read-only for all authenticated users)
CREATE POLICY "All users can read process types" ON process_types
  FOR SELECT USING (TRUE);

-- Hours policies
CREATE POLICY "Users can read own hours" ON hours
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can read team hours" ON hours
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users
      WHERE manager_id = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY "Users can insert own hours" ON hours
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can update own hours" ON hours
  FOR UPDATE USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can delete own hours" ON hours
  FOR DELETE USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

-- Processes policies
CREATE POLICY "Users can read own processes" ON processes
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can read team processes" ON processes
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users
      WHERE manager_id = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY "Users can insert own processes" ON processes
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can update own processes" ON processes
  FOR UPDATE USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can delete own processes" ON processes
  FOR DELETE USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

-- Materials policies
CREATE POLICY "Users can read own materials" ON materials
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can read team materials" ON materials
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users
      WHERE manager_id = current_setting('app.current_user_id', TRUE)
    )
  );

CREATE POLICY "Users can insert own materials" ON materials
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can update own materials" ON materials
  FOR UPDATE USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can delete own materials" ON materials
  FOR DELETE USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

-- Assignments policies
CREATE POLICY "Employees can read own assignments" ON assignments
  FOR SELECT USING (
    employee_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can read own assignments" ON assignments
  FOR SELECT USING (
    manager_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can insert assignments" ON assignments
  FOR INSERT WITH CHECK (
    manager_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can update own assignments" ON assignments
  FOR UPDATE USING (
    manager_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Employees can update assigned tasks" ON assignments
  FOR UPDATE USING (
    employee_id = current_setting('app.current_user_id', TRUE)
  );

-- Additional Works policies
CREATE POLICY "Users can read own additional works" ON additional_works
  FOR SELECT USING (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can read team additional works" ON additional_works
  FOR SELECT USING (
    manager_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Users can insert own additional works" ON additional_works
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.current_user_id', TRUE)
  );

CREATE POLICY "Managers can update additional works" ON additional_works
  FOR UPDATE USING (
    manager_id = current_setting('app.current_user_id', TRUE)
  );

-- Function to set current user context
CREATE OR REPLACE FUNCTION set_current_user_id(user_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_current_user_id IS 'Встановлює ID поточного користувача для RLS';
