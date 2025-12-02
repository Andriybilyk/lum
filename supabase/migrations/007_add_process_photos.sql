-- =====================================================
-- Міграція: Додавання фото для процесів
-- Опис: Додає можливість зберігати фото до/під час/після роботи
-- Дата: 2024
-- =====================================================

-- 1. Створюємо Storage Bucket для фото процесів
-- Виконайте це через Supabase Dashboard -> Storage -> Create Bucket
-- Назва bucket: 'process-photos'
-- Public: false (тільки аутентифіковані користувачі)

-- 2. Додаємо поля для зберігання URL фото в таблицю processes
ALTER TABLE processes
ADD COLUMN IF NOT EXISTS photo_before TEXT,
ADD COLUMN IF NOT EXISTS photo_during TEXT,
ADD COLUMN IF NOT EXISTS photo_after TEXT,
ADD COLUMN IF NOT EXISTS photos_uploaded_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Додаємо коментарі до полів
COMMENT ON COLUMN processes.photo_before IS 'URL фото перед початком роботи';
COMMENT ON COLUMN processes.photo_during IS 'URL фото під час виконання роботи';
COMMENT ON COLUMN processes.photo_after IS 'URL фото після завершення роботи';
COMMENT ON COLUMN processes.photos_uploaded_at IS 'Час останнього оновлення фото';

-- 4. Створюємо індекси для швидкого пошуку процесів з фото
CREATE INDEX IF NOT EXISTS idx_processes_with_photos
ON processes (id)
WHERE photo_before IS NOT NULL
   OR photo_during IS NOT NULL
   OR photo_after IS NOT NULL;

-- 5. Створюємо тригер для автоматичного оновлення часу зміни фото
CREATE OR REPLACE FUNCTION update_process_photos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо час тільки якщо змінилися фото
  IF (NEW.photo_before IS DISTINCT FROM OLD.photo_before)
     OR (NEW.photo_during IS DISTINCT FROM OLD.photo_during)
     OR (NEW.photo_after IS DISTINCT FROM OLD.photo_after) THEN
    NEW.photos_uploaded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_process_photos_timestamp ON processes;
CREATE TRIGGER trigger_update_process_photos_timestamp
BEFORE UPDATE ON processes
FOR EACH ROW
EXECUTE FUNCTION update_process_photos_timestamp();

-- 6. Створюємо допоміжну функцію для перевірки наявності фото
CREATE OR REPLACE FUNCTION process_has_photos(process_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_photos BOOLEAN;
BEGIN
  SELECT
    (photo_before IS NOT NULL
     OR photo_during IS NOT NULL
     OR photo_after IS NOT NULL)
  INTO has_photos
  FROM processes
  WHERE id = process_id;

  RETURN COALESCE(has_photos, FALSE);
END;
$$ LANGUAGE plpgsql;

-- 7. Створюємо view для процесів з фото (для менеджерів)
CREATE OR REPLACE VIEW processes_with_photos AS
SELECT
  p.*,
  u.name as user_name,
  CASE
    WHEN p.photo_before IS NOT NULL THEN 1 ELSE 0
  END +
  CASE
    WHEN p.photo_during IS NOT NULL THEN 1 ELSE 0
  END +
  CASE
    WHEN p.photo_after IS NOT NULL THEN 1 ELSE 0
  END as photos_count
FROM processes p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.photo_before IS NOT NULL
   OR p.photo_during IS NOT NULL
   OR p.photo_after IS NOT NULL
ORDER BY p.photos_uploaded_at DESC;

COMMENT ON VIEW processes_with_photos IS 'Всі процеси з хоча б одним фото';

-- 8. Створюємо RLS Policy для фото
-- Користувачі можуть бачити тільки свої фото
-- Менеджери можуть бачити всі фото

-- Політика для читання фото (працівники бачать тільки свої)
DROP POLICY IF EXISTS "Users can view their own process photos" ON processes;
CREATE POLICY "Users can view their own process photos"
ON processes FOR SELECT
USING (
  auth.uid()::text = user_id
  OR
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND role = 'manager'
  )
);

-- Політика для завантаження фото (тільки свої процеси)
DROP POLICY IF EXISTS "Users can upload photos to their own processes" ON processes;
CREATE POLICY "Users can upload photos to their own processes"
ON processes FOR UPDATE
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- 9. Створюємо функцію для отримання статистики по фото
CREATE OR REPLACE FUNCTION get_photo_statistics(user_id_param TEXT DEFAULT NULL)
RETURNS TABLE (
  total_processes BIGINT,
  processes_with_photos BIGINT,
  photos_before BIGINT,
  photos_during BIGINT,
  photos_after BIGINT,
  coverage_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_processes,
    COUNT(CASE
      WHEN photo_before IS NOT NULL
        OR photo_during IS NOT NULL
        OR photo_after IS NOT NULL
      THEN 1
    END) as processes_with_photos,
    COUNT(photo_before) as photos_before,
    COUNT(photo_during) as photos_during,
    COUNT(photo_after) as photos_after,
    ROUND(
      (COUNT(CASE
        WHEN photo_before IS NOT NULL
          OR photo_during IS NOT NULL
          OR photo_after IS NOT NULL
        THEN 1
      END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as coverage_percent
  FROM processes
  WHERE user_id_param IS NULL OR user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_photo_statistics IS 'Статистика по фото звітах';

-- 10. Приклади використання:

-- Отримати всі процеси з фото за останній місяць
-- SELECT * FROM processes_with_photos
-- WHERE date >= NOW() - INTERVAL '30 days';

-- Отримати статистику по фото для конкретного користувача
-- SELECT * FROM get_photo_statistics('user-id-here');

-- Отримати загальну статистику
-- SELECT * FROM get_photo_statistics();

-- Перевірити чи має процес фото
-- SELECT process_has_photos('process-id-here');

-- =====================================================
-- ВАЖЛИВО: НАЛАШТУВАННЯ STORAGE
-- =====================================================
--
-- Після виконання цієї міграції, виконайте в Supabase Dashboard:
--
-- 1. Storage -> Create Bucket
--    - Name: process-photos
--    - Public: OFF (приватний)
--    - File size limit: 5 MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
-- 2. Storage -> process-photos -> Policies -> New Policy
--
--    Policy Name: "Users can upload their own process photos"
--    Operation: INSERT
--    Target roles: authenticated
--    Policy definition:
--      WITH CHECK (
--        bucket_id = 'process-photos'
--        AND auth.uid()::text = (storage.foldername(name))[1]
--      )
--
--    Policy Name: "Users can view their own process photos"
--    Operation: SELECT
--    Target roles: authenticated
--    Policy definition:
--      USING (
--        bucket_id = 'process-photos'
--        AND (
--          auth.uid()::text = (storage.foldername(name))[1]
--          OR EXISTS (
--            SELECT 1 FROM users
--            WHERE id = auth.uid()::text
--            AND role = 'manager'
--          )
--        )
--      )
--
--    Policy Name: "Users can delete their own process photos"
--    Operation: DELETE
--    Target roles: authenticated
--    Policy definition:
--      USING (
--        bucket_id = 'process-photos'
--        AND auth.uid()::text = (storage.foldername(name))[1]
--      )
--
-- =====================================================
