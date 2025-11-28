-- ===============================================
-- ТЕСТОВІ ДАНІ ДЛЯ SUPABASE
-- ===============================================
-- Цей файл створює тестові дані для швидкого старту
-- Виконувати ПІСЛЯ міграцій 001 та 002
-- ===============================================

-- -----------------------------------------------
-- 1. РІВНІ (LEVELS)
-- -----------------------------------------------
INSERT INTO levels (id, name, hourly_rate) VALUES
('1', 'Junior', 150),
('2', 'Middle', 200),
('3', 'Senior', 250),
('4', 'Lead', 300),
('5', 'Architect', 350)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 2. ОБ'ЄКТИ (OBJECTS)
-- -----------------------------------------------
INSERT INTO objects (id, name, max_hours) VALUES
('1', 'Об''єкт A - Офіс', 160),
('2', 'Об''єкт B - Склад', 160),
('3', 'Об''єкт C - Магазин', 120),
('4', 'Об''єкт D - Ресторан', 180)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 3. ТИПИ ПРОЦЕСІВ (PROCESS_TYPES)
-- -----------------------------------------------
INSERT INTO process_types (id, name, object, unit, rate, planned_volume) VALUES
('1', 'Монтаж', 'Об''єкт A - Офіс', 'м²', 50, 100),
('2', 'Електрика', 'Об''єкт A - Офіс', 'точка', 25, 50),
('3', 'Штукатурка', 'Об''єкт B - Склад', 'м²', 30, 200),
('4', 'Малювання', 'Об''єкт B - Склад', 'м²', 20, 150),
('5', 'Плитка', 'Об''єкт C - Магазин', 'м²', 40, 80)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 4. КОРИСТУВАЧІ (USERS)
-- -----------------------------------------------

-- Менеджер 1
INSERT INTO users (id, name, role, level, hourly_rate, manager_id, telegram_id) VALUES
('100000001', 'Іван Петренко', 'manager', 'Senior', 250, NULL, '100000001')
ON CONFLICT (id) DO NOTHING;

-- Менеджер 2
INSERT INTO users (id, name, role, level, hourly_rate, manager_id, telegram_id) VALUES
('100000002', 'Марія Коваль', 'manager', 'Lead', 300, NULL, '100000002')
ON CONFLICT (id) DO NOTHING;

-- Працівники менеджера 1
INSERT INTO users (id, name, role, level, hourly_rate, manager_id, telegram_id) VALUES
('200000001', 'Олексій Шевченко', 'employee', 'Junior', 150, '100000001', '200000001'),
('200000002', 'Андрій Мельник', 'employee', 'Middle', 200, '100000001', '200000002'),
('200000003', 'Дмитро Бондаренко', 'employee', 'Senior', 250, '100000001', '200000003')
ON CONFLICT (id) DO NOTHING;

-- Працівники менеджера 2
INSERT INTO users (id, name, role, level, hourly_rate, manager_id, telegram_id) VALUES
('200000004', 'Тетяна Ткаченко', 'employee', 'Middle', 200, '100000002', '200000004'),
('200000005', 'Юлія Савченко', 'employee', 'Junior', 150, '100000002', '200000005')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 5. ГОДИНИ (HOURS) - Приклади за поточний місяць
-- -----------------------------------------------
INSERT INTO hours (id, user_id, date, hours, object, is_business_trip, salary) VALUES
-- Олексій Шевченко (Junior, 150 грн/год)
('300000001', '200000001', CURRENT_DATE - INTERVAL '5 days', 8, 'Об''єкт A - Офіс', false, 1200),
('300000002', '200000001', CURRENT_DATE - INTERVAL '4 days', 8, 'Об''єкт A - Офіс', false, 1200),
('300000003', '200000001', CURRENT_DATE - INTERVAL '3 days', 9, 'Об''єкт A - Офіс', false, 1350),

-- Андрій Мельник (Middle, 200 грн/год)
('300000004', '200000002', CURRENT_DATE - INTERVAL '5 days', 8, 'Об''єкт B - Склад', false, 1600),
('300000005', '200000002', CURRENT_DATE - INTERVAL '4 days', 10, 'Об''єкт B - Склад', true, 2400),

-- Дмитро Бондаренко (Senior, 250 грн/год)
('300000006', '200000003', CURRENT_DATE - INTERVAL '5 days', 8, 'Об''єкт C - Магазин', false, 2000),
('300000007', '200000003', CURRENT_DATE - INTERVAL '4 days', 8, 'Об''єкт C - Магазин', false, 2000),

-- Тетяна Ткаченко (Middle, 200 грн/год)
('300000008', '200000004', CURRENT_DATE - INTERVAL '5 days', 8, 'Об''єкт A - Офіс', false, 1600),

-- Юлія Савченко (Junior, 150 грн/год)
('300000009', '200000005', CURRENT_DATE - INTERVAL '5 days', 8, 'Об''єкт D - Ресторан', false, 1200)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 6. ПРОЦЕСИ (PROCESSES) - Приклади
-- -----------------------------------------------
INSERT INTO processes (id, user_id, date, process_name, object, volume, unit, rate, salary) VALUES
-- Олексій Шевченко
('400000001', '200000001', CURRENT_DATE - INTERVAL '5 days', 'Монтаж', 'Об''єкт A - Офіс', 15, 'м²', 50, 750),
('400000002', '200000001', CURRENT_DATE - INTERVAL '4 days', 'Електрика', 'Об''єкт A - Офіс', 10, 'точка', 25, 250),

-- Андрій Мельник
('400000003', '200000002', CURRENT_DATE - INTERVAL '5 days', 'Штукатурка', 'Об''єкт B - Склад', 25, 'м²', 30, 750),
('400000004', '200000002', CURRENT_DATE - INTERVAL '4 days', 'Штукатурка', 'Об''єкт B - Склад', 30, 'м²', 30, 900),

-- Дмитро Бондаренко
('400000005', '200000003', CURRENT_DATE - INTERVAL '5 days', 'Плитка', 'Об''єкт C - Магазин', 20, 'м²', 40, 800),

-- Тетяна Ткаченко
('400000006', '200000004', CURRENT_DATE - INTERVAL '5 days', 'Малювання', 'Об''єкт A - Офіс', 35, 'м²', 20, 700),

-- Юлія Савченко
('400000007', '200000005', CURRENT_DATE - INTERVAL '5 days', 'Монтаж', 'Об''єкт D - Ресторан', 12, 'м²', 50, 600)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 7. МАТЕРІАЛИ (MATERIALS) - Приклади
-- -----------------------------------------------
INSERT INTO materials (id, user_id, date, object, material_name, quantity, unit, notes) VALUES
-- Олексій Шевченко
('500000001', '200000001', CURRENT_DATE - INTERVAL '5 days', 'Об''єкт A - Офіс', 'Профіль металевий', 50, 'м', 'Для каркасу'),
('500000002', '200000001', CURRENT_DATE - INTERVAL '4 days', 'Об''єкт A - Офіс', 'Кабель ВВГ 3x2.5', 100, 'м', NULL),

-- Андрій Мельник
('500000003', '200000002', CURRENT_DATE - INTERVAL '5 days', 'Об''єкт B - Склад', 'Штукатурка гіпсова', 25, 'кг', NULL),
('500000004', '200000002', CURRENT_DATE - INTERVAL '4 days', 'Об''єкт B - Склад', 'Сітка армуюча', 15, 'м²', NULL),

-- Дмитро Бондаренко
('500000005', '200000003', CURRENT_DATE - INTERVAL '5 days', 'Об''єкт C - Магазин', 'Плитка керамічна', 22, 'м²', 'Колір: білий'),
('500000006', '200000003', CURRENT_DATE - INTERVAL '5 days', 'Об''єкт C - Магазин', 'Клей для плитки', 30, 'кг', NULL),

-- Тетяна Ткаченко
('500000007', '200000004', CURRENT_DATE - INTERVAL '5 days', 'Об''єкт A - Офіс', 'Фарба акрилова', 15, 'л', 'Колір: слонова кістка'),

-- Юлія Савченко
('500000008', '200000005', CURRENT_DATE - INTERVAL '5 days', 'Об''єкт D - Ресторан', 'Гіпсокартон', 20, 'лист', '12.5 мм')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 8. ASSIGNMENTS - Приклади призначень
-- -----------------------------------------------
INSERT INTO assignments (id, user_id, manager_id, status, created_at, updated_at) VALUES
('600000001', '200000001', '100000001', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('600000002', '200000002', '100000001', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('600000003', '200000003', '100000001', 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('600000004', '200000004', '100000002', 'confirmed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
('600000005', '200000005', '100000002', 'pending', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------
-- 9. ADDITIONAL WORKS - Приклади додаткових завдань
-- -----------------------------------------------
INSERT INTO additional_works (id, user_id, manager_id, title, description, status, due_date, created_at, updated_at) VALUES
('700000001', '200000001', '100000001', 'Підготувати інструменти', 'Перевірити всі інструменти перед початком роботи', 'completed', CURRENT_DATE - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
('700000002', '200000002', '100000001', 'Звіт по матеріалах', 'Скласти детальний звіт використаних матеріалів', 'in_progress', CURRENT_DATE + INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW()),
('700000003', '200000004', '100000002', 'Фото прогресу', 'Зробити фото результатів роботи', 'pending', CURRENT_DATE + INTERVAL '5 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ===============================================
-- ПЕРЕВІРКА ДАНИХ
-- ===============================================

-- Підрахунок записів
SELECT
  'levels' as table_name, COUNT(*) as count FROM levels
UNION ALL
SELECT 'objects', COUNT(*) FROM objects
UNION ALL
SELECT 'process_types', COUNT(*) FROM process_types
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'hours', COUNT(*) FROM hours
UNION ALL
SELECT 'processes', COUNT(*) FROM processes
UNION ALL
SELECT 'materials', COUNT(*) FROM materials
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'additional_works', COUNT(*) FROM additional_works
ORDER BY table_name;

-- ===============================================
-- ТЕСТОВІ ДАНІ СТВОРЕНО!
-- ===============================================
--
-- Тепер можна логінитися з будь-яким telegram_id:
--
-- МЕНЕДЖЕРИ:
--   - 100000001 (Іван Петренко)
--   - 100000002 (Марія Коваль)
--
-- ПРАЦІВНИКИ:
--   - 200000001 (Олексій Шевченко)
--   - 200000002 (Андрій Мельник)
--   - 200000003 (Дмитро Бондаренко)
--   - 200000004 (Тетяна Ткаченко)
--   - 200000005 (Юлія Савченко)
--
-- ===============================================
