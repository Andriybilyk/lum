-- =====================================================
-- Міграція: Додавання фото для об'єктів
-- Опис: Додає можливість менеджерам завантажувати фото об'єктів для звітності
-- Дата: 2024
-- =====================================================

-- 1. Додаємо поля для зберігання фото об'єктів
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS photos_updated_at TIMESTAMPTZ DEFAULT NOW();

-- JSONB формат для масиву фото:
-- [
--   {
--     "url": "data:image/jpeg;base64,...",
--     "label": "Фасад будівлі",
--     "uploadedBy": "manager-user-id",
--     "uploadedAt": "2024-01-15T10:30:00Z"
--   }
-- ]

-- 2. Додаємо коментарі до полів
COMMENT ON COLUMN objects.photos IS 'Масив фото об''єкта у форматі JSONB';
COMMENT ON COLUMN objects.photos_updated_at IS 'Час останнього оновлення фото';

-- 3. Створюємо індекси для швидкого пошуку об'єктів з фото
CREATE INDEX IF NOT EXISTS idx_objects_with_photos
ON objects USING GIN (photos)
WHERE jsonb_array_length(photos) > 0;

CREATE INDEX IF NOT EXISTS idx_objects_photos_updated
ON objects (photos_updated_at DESC)
WHERE jsonb_array_length(photos) > 0;

-- 4. Створюємо тригер для автоматичного оновлення часу зміни фото
CREATE OR REPLACE FUNCTION update_object_photos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Оновлюємо час тільки якщо змінилися фото
  IF (NEW.photos IS DISTINCT FROM OLD.photos) THEN
    NEW.photos_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_object_photos_timestamp ON objects;
CREATE TRIGGER trigger_update_object_photos_timestamp
BEFORE UPDATE ON objects
FOR EACH ROW
EXECUTE FUNCTION update_object_photos_timestamp();

-- 5. Створюємо допоміжні функції

-- Функція: Кількість фото у об'єкта
CREATE OR REPLACE FUNCTION object_photos_count(object_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  SELECT jsonb_array_length(COALESCE(photos, '[]'::jsonb))
  INTO photo_count
  FROM objects
  WHERE id = object_id;

  RETURN COALESCE(photo_count, 0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION object_photos_count IS 'Повертає кількість фото для об''єкта';

-- Функція: Чи має об'єкт фото
CREATE OR REPLACE FUNCTION object_has_photos(object_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_photos BOOLEAN;
BEGIN
  SELECT jsonb_array_length(COALESCE(photos, '[]'::jsonb)) > 0
  INTO has_photos
  FROM objects
  WHERE id = object_id;

  RETURN COALESCE(has_photos, FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION object_has_photos IS 'Перевіряє чи має об''єкт хоча б одне фото';

-- Функція: Додати фото до об'єкта
CREATE OR REPLACE FUNCTION add_object_photo(
  object_id TEXT,
  photo_url TEXT,
  photo_label TEXT,
  uploaded_by TEXT
)
RETURNS JSONB AS $$
DECLARE
  new_photo JSONB;
  updated_photos JSONB;
BEGIN
  -- Створюємо новий об'єкт фото
  new_photo := jsonb_build_object(
    'url', photo_url,
    'label', photo_label,
    'uploadedBy', uploaded_by,
    'uploadedAt', NOW()
  );

  -- Додаємо до масиву фото
  UPDATE objects
  SET photos = COALESCE(photos, '[]'::jsonb) || new_photo
  WHERE id = object_id
  RETURNING photos INTO updated_photos;

  RETURN updated_photos;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION add_object_photo IS 'Додає нове фото до об''єкта';

-- Функція: Видалити фото з об'єкта (по індексу)
CREATE OR REPLACE FUNCTION remove_object_photo(
  object_id TEXT,
  photo_index INTEGER
)
RETURNS JSONB AS $$
DECLARE
  updated_photos JSONB;
BEGIN
  UPDATE objects
  SET photos = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(photos) WITH ORDINALITY arr(elem, idx)
    WHERE idx != photo_index + 1
  )
  WHERE id = object_id
  RETURNING photos INTO updated_photos;

  RETURN COALESCE(updated_photos, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION remove_object_photo IS 'Видаляє фото з об''єкта за індексом';

-- 6. Створюємо view для об'єктів з фото
CREATE OR REPLACE VIEW objects_with_photos AS
SELECT
  o.*,
  jsonb_array_length(COALESCE(o.photos, '[]'::jsonb)) as photos_count,
  u.name as manager_name
FROM objects o
LEFT JOIN users u ON o.manager_id = u.id
WHERE jsonb_array_length(COALESCE(o.photos, '[]'::jsonb)) > 0
ORDER BY o.photos_updated_at DESC;

COMMENT ON VIEW objects_with_photos IS 'Всі об''єкти з хоча б одним фото';

-- 7. Функція: Статистика по фото об'єктів
CREATE OR REPLACE FUNCTION get_object_photos_statistics(manager_id_param TEXT DEFAULT NULL)
RETURNS TABLE (
  total_objects BIGINT,
  objects_with_photos BIGINT,
  total_photos BIGINT,
  coverage_percent NUMERIC,
  avg_photos_per_object NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_objects,
    COUNT(CASE
      WHEN jsonb_array_length(COALESCE(photos, '[]'::jsonb)) > 0
      THEN 1
    END) as objects_with_photos,
    COALESCE(
      SUM(jsonb_array_length(COALESCE(photos, '[]'::jsonb))),
      0
    ) as total_photos,
    ROUND(
      (COUNT(CASE
        WHEN jsonb_array_length(COALESCE(photos, '[]'::jsonb)) > 0
        THEN 1
      END)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as coverage_percent,
    ROUND(
      COALESCE(
        SUM(jsonb_array_length(COALESCE(photos, '[]'::jsonb)))::NUMERIC /
        NULLIF(COUNT(CASE
          WHEN jsonb_array_length(COALESCE(photos, '[]'::jsonb)) > 0
          THEN 1
        END), 0),
        0
      ),
      2
    ) as avg_photos_per_object
  FROM objects
  WHERE manager_id_param IS NULL OR manager_id = manager_id_param;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_object_photos_statistics IS 'Статистика по фото об''єктів';

-- 8. Створюємо RLS політики для фото об'єктів

-- Менеджери можуть переглядати фото своїх об'єктів
DROP POLICY IF EXISTS "Managers can view photos of their objects" ON objects;
CREATE POLICY "Managers can view photos of their objects"
ON objects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND (role = 'manager' OR manager_id = objects.manager_id)
  )
);

-- Менеджери можуть додавати/оновлювати фото до своїх об'єктів
DROP POLICY IF EXISTS "Managers can update photos of their objects" ON objects;
CREATE POLICY "Managers can update photos of their objects"
ON objects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND role = 'manager'
    AND (id = objects.manager_id OR objects.manager_id IS NULL)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND role = 'manager'
  )
);

-- 9. Функція: Отримати всі фото з усіх об'єктів для менеджера
CREATE OR REPLACE FUNCTION get_all_object_photos(manager_id_param TEXT)
RETURNS TABLE (
  object_id TEXT,
  object_name TEXT,
  object_address TEXT,
  photo_url TEXT,
  photo_label TEXT,
  uploaded_by TEXT,
  uploaded_by_name TEXT,
  uploaded_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id as object_id,
    o.name as object_name,
    o.address as object_address,
    (photo->>'url')::TEXT as photo_url,
    (photo->>'label')::TEXT as photo_label,
    (photo->>'uploadedBy')::TEXT as uploaded_by,
    u.name as uploaded_by_name,
    (photo->>'uploadedAt')::TIMESTAMPTZ as uploaded_at
  FROM objects o
  CROSS JOIN jsonb_array_elements(COALESCE(o.photos, '[]'::jsonb)) as photo
  LEFT JOIN users u ON (photo->>'uploadedBy')::TEXT = u.id
  WHERE o.manager_id = manager_id_param
     OR manager_id_param IS NULL
  ORDER BY (photo->>'uploadedAt')::TIMESTAMPTZ DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_all_object_photos IS 'Отримати всі фото з усіх об''єктів менеджера';

-- 10. Приклади використання:

-- Додати фото до об'єкта
-- SELECT add_object_photo('object-id', 'data:image/jpeg;base64,...', 'Фасад', 'manager-id');

-- Видалити фото (індекс 0 = перше фото)
-- SELECT remove_object_photo('object-id', 0);

-- Кількість фото
-- SELECT object_photos_count('object-id');

-- Чи є фото
-- SELECT object_has_photos('object-id');

-- Статистика
-- SELECT * FROM get_object_photos_statistics();
-- SELECT * FROM get_object_photos_statistics('manager-id');

-- Всі об'єкти з фото
-- SELECT * FROM objects_with_photos;

-- Всі фото менеджера
-- SELECT * FROM get_all_object_photos('manager-id');
-- SELECT * FROM get_all_object_photos(NULL); -- всі фото

-- =====================================================
-- ВАЖЛИВО: Структура JSONB для фото
-- =====================================================
--
-- Кожне фото в масиві має структуру:
-- {
--   "url": "data:image/jpeg;base64,/9j/4AAQ...",  -- Base64 зображення
--   "label": "Фасад будівлі",                     -- Підпис до фото
--   "uploadedBy": "user-id-123",                  -- ID користувача
--   "uploadedAt": "2024-01-15T10:30:00Z"          -- Час завантаження
-- }
--
-- Приклад повного масиву:
-- [
--   {
--     "url": "data:image/jpeg;base64,...",
--     "label": "Фасад",
--     "uploadedBy": "manager-1",
--     "uploadedAt": "2024-01-15T10:30:00Z"
--   },
--   {
--     "url": "data:image/jpeg;base64,...",
--     "label": "Інтер'єр",
--     "uploadedBy": "manager-1",
--     "uploadedAt": "2024-01-15T11:00:00Z"
--   }
-- ]
--
-- =====================================================

-- Готово! ✅
-- Тепер об'єкти можуть мати необмежену кількість фото
-- Менеджери можуть додавати, переглядати та видаляти фото
-- Всі фото зберігаються в форматі JSONB для гнучкості
