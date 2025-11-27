-- Initial database schema for Time Tracking Telegram Mini App
-- Migration: 001_initial_schema
-- Created: 2024

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
  level TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  telegram_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Levels table
CREATE TABLE levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Objects table
CREATE TABLE objects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_business_trip BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Process Types table
CREATE TABLE process_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  object TEXT,
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  planned_volume DECIMAL(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, object)
);

-- Hours table
CREATE TABLE hours (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  object TEXT NOT NULL,
  is_business_trip BOOLEAN NOT NULL DEFAULT FALSE,
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Processes table
CREATE TABLE processes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  process_name TEXT NOT NULL,
  object TEXT,
  volume DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  object TEXT NOT NULL,
  material_name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'declined', 'employee_confirmed', 'manager_confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Additional Works table
CREATE TABLE additional_works (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manager_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_name TEXT NOT NULL,
  date DATE NOT NULL,
  work_name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL,
  volume DECIMAL(10, 2) NOT NULL DEFAULT 0,
  rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_hours_user_id ON hours(user_id);
CREATE INDEX idx_hours_date ON hours(date);
CREATE INDEX idx_hours_user_date ON hours(user_id, date);

CREATE INDEX idx_processes_user_id ON processes(user_id);
CREATE INDEX idx_processes_date ON processes(date);
CREATE INDEX idx_processes_user_date ON processes(user_id, date);

CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_date ON materials(date);
CREATE INDEX idx_materials_user_date ON materials(user_id, date);
CREATE INDEX idx_materials_object ON materials(object);

CREATE INDEX idx_assignments_employee_id ON assignments(employee_id);
CREATE INDEX idx_assignments_manager_id ON assignments(manager_id);
CREATE INDEX idx_assignments_status ON assignments(status);

CREATE INDEX idx_additional_works_user_id ON additional_works(user_id);
CREATE INDEX idx_additional_works_manager_id ON additional_works(manager_id);
CREATE INDEX idx_additional_works_status ON additional_works(status);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_levels_updated_at BEFORE UPDATE ON levels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON objects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_process_types_updated_at BEFORE UPDATE ON process_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hours_updated_at BEFORE UPDATE ON hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processes_updated_at BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_additional_works_updated_at BEFORE UPDATE ON additional_works
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Користувачі системи (працівники та менеджери)';
COMMENT ON TABLE levels IS 'Рівні працівників з погодинною ставкою';
COMMENT ON TABLE objects IS 'Об''єкти/проєкти для роботи';
COMMENT ON TABLE process_types IS 'Типи процесів з ставками';
COMMENT ON TABLE hours IS 'Відпрацьовані години працівників';
COMMENT ON TABLE processes IS 'Виконані процеси працівників';
COMMENT ON TABLE materials IS 'Використані матеріали на об''єктах';
COMMENT ON TABLE assignments IS 'Завдання від менеджерів працівникам';
COMMENT ON TABLE additional_works IS 'Додаткові роботи для затвердження';
