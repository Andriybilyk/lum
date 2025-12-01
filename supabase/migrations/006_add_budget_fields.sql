-- Додаємо поля бюджету до таблиці objects

-- Запланований бюджет на об'єкт
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS planned_budget DECIMAL(10, 2) DEFAULT 0;

-- Фактичний витрачений бюджет (автоматично підраховується)
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS actual_budget DECIMAL(10, 2) DEFAULT 0;

-- Вартість матеріалів на об'єкт
ALTER TABLE objects
ADD COLUMN IF NOT EXISTS materials_cost DECIMAL(10, 2) DEFAULT 0;

-- Коментарі
COMMENT ON COLUMN objects.planned_budget IS 'Запланований бюджет на об''єкт в гривнях';
COMMENT ON COLUMN objects.actual_budget IS 'Фактичний витрачений бюджет (заробітна плата + матеріали)';
COMMENT ON COLUMN objects.materials_cost IS 'Вартість всіх матеріалів використаних на об''єкті';

-- Функція для автоматичного оновлення actual_budget
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
  ) + COALESCE(materials_cost, 0)
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
