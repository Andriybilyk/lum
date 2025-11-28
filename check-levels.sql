-- SQL запит для перевірки даних в таблиці levels
-- Запустіть цей запит в Supabase SQL Editor:

SELECT
  id,
  name,
  hourly_rate,
  created_at
FROM levels
ORDER BY id;
