-- Міграція: Додавання цін для матеріалів
-- Дата: 2025
-- Опис: Додаємо можливість вказувати ціну за одиницю та автоматично рахувати загальну вартість

-- Додаємо поля для ціни та загальної вартості
ALTER TABLE materials
ADD COLUMN price DECIMAL(10, 2),
ADD COLUMN total_cost DECIMAL(10, 2);

-- Коментарі до полів
COMMENT ON COLUMN materials.price IS 'Ціна за одиницю матеріалу (необов\'язково)';
COMMENT ON COLUMN materials.total_cost IS 'Загальна вартість (quantity * price, розраховується автоматично)';

-- Функція для автоматичного розрахунку загальної вартості
CREATE OR REPLACE FUNCTION calculate_material_total_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Якщо вказано ціну, рахуємо загальну вартість
  IF NEW.price IS NOT NULL THEN
    NEW.total_cost := NEW.quantity * NEW.price;
  ELSE
    NEW.total_cost := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Тригер для автоматичного розрахунку total_cost
CREATE TRIGGER material_calculate_total_cost
BEFORE INSERT OR UPDATE OF quantity, price ON materials
FOR EACH ROW
EXECUTE FUNCTION calculate_material_total_cost();

-- Функція для отримання статистики по матеріалах з вартістю
CREATE OR REPLACE FUNCTION get_materials_cost_by_object(
  p_object_name TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  object_name TEXT,
  total_materials_cost DECIMAL,
  materials_count BIGINT,
  period_start DATE,
  period_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_object_name::TEXT as object_name,
    COALESCE(SUM(m.total_cost), 0)::DECIMAL as total_materials_cost,
    COUNT(m.id)::BIGINT as materials_count,
    COALESCE(p_start_date, MIN(m.date)) as period_start,
    COALESCE(p_end_date, MAX(m.date)) as period_end
  FROM materials m
  WHERE m.object = p_object_name
    AND (p_start_date IS NULL OR m.date >= p_start_date)
    AND (p_end_date IS NULL OR m.date <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Функція для отримання топ-5 найдорожчих матеріалів
CREATE OR REPLACE FUNCTION get_top_expensive_materials(
  p_object_name TEXT DEFAULT NULL,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  material_name TEXT,
  total_spent DECIMAL,
  times_used BIGINT,
  avg_price DECIMAL,
  object TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.material_name,
    SUM(m.total_cost) as total_spent,
    COUNT(m.id)::BIGINT as times_used,
    AVG(m.price) as avg_price,
    m.object
  FROM materials m
  WHERE m.total_cost IS NOT NULL
    AND (p_object_name IS NULL OR m.object = p_object_name)
  GROUP BY m.material_name, m.object
  ORDER BY total_spent DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Створюємо індекс для швидкого пошуку по вартості
CREATE INDEX idx_materials_total_cost ON materials(total_cost) WHERE total_cost IS NOT NULL;
CREATE INDEX idx_materials_price ON materials(price) WHERE price IS NOT NULL;
CREATE INDEX idx_materials_object_date ON materials(object, date);

-- View для швидкого перегляду матеріалів з вартістю
CREATE OR REPLACE VIEW materials_with_cost AS
SELECT
  m.id,
  m.user_id,
  u.name as user_name,
  m.date,
  m.object,
  m.material_name,
  m.quantity,
  m.unit,
  m.price,
  m.total_cost,
  m.notes,
  m.created_at,
  m.updated_at,
  CASE
    WHEN m.total_cost IS NOT NULL THEN TRUE
    ELSE FALSE
  END as has_pricing
FROM materials m
LEFT JOIN users u ON m.user_id = u.id
ORDER BY m.date DESC, m.created_at DESC;

-- Надаємо доступ до view
GRANT SELECT ON materials_with_cost TO authenticated;

-- Коментарі до функцій
COMMENT ON FUNCTION calculate_material_total_cost() IS 'Автоматично розраховує загальну вартість матеріалу (кількість × ціна)';
COMMENT ON FUNCTION get_materials_cost_by_object(TEXT, DATE, DATE) IS 'Повертає загальну вартість матеріалів для об\'єкта за період';
COMMENT ON FUNCTION get_top_expensive_materials(TEXT, INT) IS 'Повертає топ найдорожчих матеріалів';
