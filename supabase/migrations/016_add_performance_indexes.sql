-- Міграція: Додавання індексів для оптимізації запитів з фільтрацією по підрозділах
-- Дата: 2024-12-04
-- Опис: Індекси для прискорення фільтрації даних по department_id та user_id

-- Індекс для швидкої фільтрації користувачів по підрозділу
CREATE INDEX IF NOT EXISTS idx_users_department_id
ON users(department_id);

-- Індекс для швидкої фільтрації рівнів по підрозділу
CREATE INDEX IF NOT EXISTS idx_levels_department_id
ON levels(department_id);

-- Індекс для швидкої фільтрації об'єктів по підрозділу
CREATE INDEX IF NOT EXISTS idx_objects_department_id
ON objects(department_id);

-- Індекс для швидкої фільтрації типів процесів по підрозділу
CREATE INDEX IF NOT EXISTS idx_process_types_department_id
ON process_types(department_id);

-- Індекси для швидкої фільтрації даних по user_id
CREATE INDEX IF NOT EXISTS idx_hours_user_id
ON hours(user_id);

CREATE INDEX IF NOT EXISTS idx_processes_user_id
ON processes(user_id);

CREATE INDEX IF NOT EXISTS idx_materials_user_id
ON materials(user_id);

CREATE INDEX IF NOT EXISTS idx_work_photos_user_id
ON work_photos(user_id);

-- Індекси для assignments (фільтрація по employee_id АБО manager_id)
CREATE INDEX IF NOT EXISTS idx_assignments_employee_id
ON assignments(employee_id);

CREATE INDEX IF NOT EXISTS idx_assignments_manager_id
ON assignments(manager_id);

-- Індекси для additional_works (фільтрація по user_id АБО manager_id)
CREATE INDEX IF NOT EXISTS idx_additional_works_user_id
ON additional_works(user_id);

CREATE INDEX IF NOT EXISTS idx_additional_works_manager_id
ON additional_works(manager_id);

-- Композитні індекси для звітів (фільтрація по user_id + сортування по date)
CREATE INDEX IF NOT EXISTS idx_hours_user_date
ON hours(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_processes_user_date
ON processes(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_materials_user_date
ON materials(user_id, date DESC);

-- Перевірка створених індексів
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%department_id'
    OR indexname LIKE 'idx_%user_id'
    OR indexname LIKE 'idx_%employee_id'
    OR indexname LIKE 'idx_%manager_id';

  RAISE NOTICE 'Created % performance indexes', index_count;
END $$;
