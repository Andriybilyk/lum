-- Таблиця підрозділів компанії
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Додаємо початкові підрозділи
INSERT INTO departments (id, name, description) VALUES
  ('facade', 'Фасад', 'Підрозділ фасадних робіт'),
  ('carpentry', 'Столярні Вироби', 'Підрозділ столярних виробів'),
  ('walls', 'Стіни', 'Підрозділ робіт зі стінами')
ON CONFLICT (id) DO NOTHING;

-- RLS для departments (всі можуть читати список підрозділів)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Тригер для автоматичного оновлення updated_at
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();

-- Коментарі
COMMENT ON TABLE departments IS 'Підрозділи компанії (фасад, столярка, стіни тощо)';
COMMENT ON COLUMN departments.id IS 'Унікальний ідентифікатор підрозділу';
COMMENT ON COLUMN departments.name IS 'Назва підрозділу';
