-- Додаємо department_id до таблиці users
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id) ON DELETE RESTRICT;

-- Встановлюємо дефолтний підрозділ для існуючих користувачів (якщо є)
UPDATE users SET department_id = 'facade' WHERE department_id IS NULL;

-- Робимо поле обов'язковим після міграції
ALTER TABLE users ALTER COLUMN department_id SET NOT NULL;

-- Додаємо department_id до таблиці levels
ALTER TABLE levels ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id) ON DELETE CASCADE;
UPDATE levels SET department_id = 'facade' WHERE department_id IS NULL;
ALTER TABLE levels ALTER COLUMN department_id SET NOT NULL;

-- Додаємо department_id до таблиці objects
ALTER TABLE objects ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id) ON DELETE CASCADE;
UPDATE objects SET department_id = 'facade' WHERE department_id IS NULL;
ALTER TABLE objects ALTER COLUMN department_id SET NOT NULL;

-- Додаємо department_id до таблиці process_types
ALTER TABLE process_types ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id) ON DELETE CASCADE;
UPDATE process_types SET department_id = 'facade' WHERE department_id IS NULL;
ALTER TABLE process_types ALTER COLUMN department_id SET NOT NULL;

-- Додаємо department_id до таблиці hours (через user_id)
-- Для hours, processes, materials, work_photos, assignments, additional_works
-- department_id визначається через user_id, тому не додаємо поле напряму

-- Створюємо індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_levels_department_id ON levels(department_id);
CREATE INDEX IF NOT EXISTS idx_objects_department_id ON objects(department_id);
CREATE INDEX IF NOT EXISTS idx_process_types_department_id ON process_types(department_id);

-- Коментарі
COMMENT ON COLUMN users.department_id IS 'Підрозділ, до якого належить користувач';
COMMENT ON COLUMN levels.department_id IS 'Підрозділ, до якого належить рівень';
COMMENT ON COLUMN objects.department_id IS 'Підрозділ, до якого належить об''єкт';
COMMENT ON COLUMN process_types.department_id IS 'Підрозділ, до якого належить тип процесу';
