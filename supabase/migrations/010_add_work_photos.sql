-- Таблиця для загальних фото роботи (не прив'язані до конкретного процесу)
CREATE TABLE IF NOT EXISTS work_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object TEXT NOT NULL,
  date DATE NOT NULL,
  photo_url TEXT NOT NULL,
  description TEXT,
  photo_type TEXT CHECK (photo_type IN ('general', 'progress', 'issue', 'completion')) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Індекси для швидкого пошуку
CREATE INDEX idx_work_photos_user_id ON work_photos(user_id);
CREATE INDEX idx_work_photos_object ON work_photos(object);
CREATE INDEX idx_work_photos_date ON work_photos(date);
CREATE INDEX idx_work_photos_created_at ON work_photos(created_at);

-- RLS політики
ALTER TABLE work_photos ENABLE ROW LEVEL SECURITY;

-- Користувачі можуть бачити свої фото
CREATE POLICY "Users can view their own work photos"
  ON work_photos
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Менеджери можуть бачити фото своїх працівників
CREATE POLICY "Managers can view their employees work photos"
  ON work_photos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = work_photos.user_id
      AND users.manager_id = auth.uid()
    )
  );

-- Користувачі можуть створювати свої фото
CREATE POLICY "Users can create their own work photos"
  ON work_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Користувачі можуть оновлювати свої фото
CREATE POLICY "Users can update their own work photos"
  ON work_photos
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Користувачі можуть видаляти свої фото
CREATE POLICY "Users can delete their own work photos"
  ON work_photos
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Менеджери можуть видаляти фото своїх працівників
CREATE POLICY "Managers can delete their employees work photos"
  ON work_photos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = work_photos.user_id
      AND users.manager_id = auth.uid()
    )
  );

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_work_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER work_photos_updated_at
  BEFORE UPDATE ON work_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_work_photos_updated_at();

-- Коментарі
COMMENT ON TABLE work_photos IS 'Загальні фото робіт на об''єктах (не прив''язані до конкретних процесів)';
COMMENT ON COLUMN work_photos.photo_type IS 'Тип фото: general (загальне), progress (прогрес), issue (проблема), completion (завершення)';
