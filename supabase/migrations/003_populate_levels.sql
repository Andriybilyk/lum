-- Заповнення таблиці levels (рівнів) з фактичними ставками
-- Додаємо рівні з вказаними ставками

INSERT INTO levels (id, name, hourly_rate) VALUES
('1', 'Стажер', 150),
('2', 'Рівень 1', 175),
('3', 'Рівень 2', 200),
('4', 'Менеджер', 260),
('5', 'Рівень 3', 225),
('6', 'Рівень 4', 250)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  hourly_rate = EXCLUDED.hourly_rate;

-- Перевірка результату
SELECT
  id,
  name,
  hourly_rate,
  'Рівень успішно додано' as status
FROM levels
ORDER BY id;
