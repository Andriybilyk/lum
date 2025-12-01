-- ========================================
-- ІНСТРУКЦІЇ ДЛЯ ВИКОНАННЯ:
-- ========================================
-- 1. Відкрийте Supabase Dashboard: https://zdfogogoqnsdinjxkdtl.supabase.co
-- 2. Перейдіть в розділ "SQL Editor"
-- 3. Створіть новий запит
-- 4. Скопіюйте весь цей код і виконайте його
-- ========================================

-- Додаємо нові поля до таблиці objects
-- Ці поля підтримують розширене керування об'єктами

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

-- Дата створення запису
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Дата останнього оновлення
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Створюємо індекси для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_objects_manager_id ON objects(manager_id);
CREATE INDEX IF NOT EXISTS idx_objects_dates ON objects(start_date, end_date);

-- Додаємо коментарі до таблиці та полів
COMMENT ON TABLE objects IS 'Зберігає проекти/об''єкти з метаданими включаючи локацію, таймлайн та відповідального менеджера';
COMMENT ON COLUMN objects.max_hours IS 'Максимальна заплановані години для цього об''єкта/проекту';
COMMENT ON COLUMN objects.address IS 'Фізична адреса або локація об''єкта';
COMMENT ON COLUMN objects.manager_id IS 'ID менеджера відповідального за цей об''єкт';
COMMENT ON COLUMN objects.start_date IS 'Дата початку проекту';
COMMENT ON COLUMN objects.end_date IS 'Дедлайн/дата завершення проекту';

-- Перевірка: показати структуру таблиці objects
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'objects'
ORDER BY ordinal_position;
