-- ========================================
-- ВИКОНАЙТЕ ЦЕЙ КОД В SUPABASE SQL EDITOR
-- ========================================
-- 1. Відкрийте: https://zdfogogoqnsdinjxkdtl.supabase.co
-- 2. Перейдіть: SQL Editor
-- 3. Скопіюйте весь код нижче і виконайте
-- ========================================

-- КРОК 1: Додаємо нові поля до таблиці objects
-- ========================================

-- Максимальна кількість годин на проект
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS max_hours INTEGER DEFAULT 160;

-- Фізична адреса об'єкта
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS address TEXT;

-- Відповідальний менеджер
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Дата початку проекту
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Дедлайн/дата завершення проекту
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Запланований бюджет на об'єкт (в гривнях)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS planned_budget DECIMAL(10, 2) DEFAULT 0;

-- Фактичний витрачений бюджет (заробітна плата + матеріали)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS actual_budget DECIMAL(10, 2) DEFAULT 0;

-- Вартість матеріалів на об'єкт
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS materials_cost DECIMAL(10, 2) DEFAULT 0;

-- Дата створення запису
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Дата останнього оновлення
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();


-- КРОК 2: Створюємо індекси для швидкого пошуку
-- ========================================

CREATE INDEX IF NOT EXISTS idx_objects_manager_id ON objects(manager_id);
CREATE INDEX IF NOT EXISTS idx_objects_dates ON objects(start_date, end_date);


-- КРОК 3: Додаємо коментарі (документація)
-- ========================================

COMMENT ON TABLE objects IS 'Зберігає проекти/об''єкти з метаданими включаючи локацію, таймлайн та відповідального менеджера';
COMMENT ON COLUMN objects.max_hours IS 'Максимальна заплановані години для цього об''єкта/проекту';
COMMENT ON COLUMN objects.address IS 'Фізична адреса або локація об''єкта';
COMMENT ON COLUMN objects.manager_id IS 'ID менеджера відповідального за цей об''єкт';
COMMENT ON COLUMN objects.start_date IS 'Дата початку проекту';
COMMENT ON COLUMN objects.end_date IS 'Дедлайн/дата завершення проекту';
COMMENT ON COLUMN objects.planned_budget IS 'Запланований бюджет на об''єкт в гривнях';
COMMENT ON COLUMN objects.actual_budget IS 'Фактичний витрачений бюджет (заробітна плата + матеріали)';
COMMENT ON COLUMN objects.materials_cost IS 'Вартість всіх матеріалів використаних на об''єкті';


-- КРОК 4: Автоматичне оновлення actual_budget (опціонально)
-- ========================================
-- Ця функція автоматично підраховує фактичний бюджет при додаванні годин/процесів
-- УВАГА: Може бути повільною на великих таблицях, можна пропустити

CREATE OR REPLACE FUNCTION update_object_actual_budget()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо фактичний бюджет при додаванні/оновленні годин або процесів
  UPDATE objects
  SET actual_budget = (
    SELECT COALESCE(SUM(salary), 0)
    FROM (
      SELECT salary FROM hours WHERE object = objects.name
      UNION ALL
      SELECT salary FROM processes WHERE object = objects.name
    ) combined
  ) + COALESCE(materials_cost, 0),
  updated_at = NOW()
  WHERE name = NEW.object;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для таблиці hours
DROP TRIGGER IF EXISTS update_budget_on_hours ON hours;
CREATE TRIGGER update_budget_on_hours
  AFTER INSERT OR UPDATE ON hours
  FOR EACH ROW
  EXECUTE FUNCTION update_object_actual_budget();

-- Тригер для таблиці processes
DROP TRIGGER IF EXISTS update_budget_on_processes ON processes;
CREATE TRIGGER update_budget_on_processes
  AFTER INSERT OR UPDATE ON processes
  FOR EACH ROW
  EXECUTE FUNCTION update_object_actual_budget();


-- КРОК 5: Перевірка результатів
-- ========================================
-- Цей запит покаже всю структуру таблиці objects

SELECT
    column_name as "Поле",
    data_type as "Тип",
    is_nullable as "Може бути NULL",
    column_default as "Значення за замовчуванням"
FROM information_schema.columns
WHERE table_name = 'objects'
ORDER BY ordinal_position;

-- Якщо все пройшло успішно, ви побачите всі нові поля у таблиці!
