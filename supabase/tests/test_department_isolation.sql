-- Тестовий SQL скрипт для перевірки ізоляції даних між підрозділами
-- Використання: Виконати в Supabase SQL Editor

-- ============================================
-- ЧАСТИНА 1: Перевірка розподілу даних
-- ============================================

-- 1.1 Перевірка підрозділів
SELECT '=== ПІДРОЗДІЛИ ===' as section;
SELECT id, name, description
FROM departments
ORDER BY name;

-- 1.2 Розподіл користувачів по підрозділах
SELECT '=== КОРИСТУВАЧІ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  u.role,
  COUNT(*) as user_count
FROM users u
JOIN departments d ON u.department_id = d.id
GROUP BY d.name, u.role
ORDER BY d.name, u.role;

-- 1.3 Розподіл об'єктів по підрозділах
SELECT '=== ОБ''ЄКТИ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  COUNT(o.id) as object_count,
  STRING_AGG(o.name, ', ') as object_names
FROM departments d
LEFT JOIN objects o ON o.department_id = d.id
GROUP BY d.name
ORDER BY d.name;

-- 1.4 Розподіл рівнів по підрозділах
SELECT '=== РІВНІ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  COUNT(l.id) as level_count,
  STRING_AGG(l.name, ', ') as level_names
FROM departments d
LEFT JOIN levels l ON l.department_id = d.id
GROUP BY d.name
ORDER BY d.name;

-- 1.5 Розподіл типів процесів по підрозділах
SELECT '=== ТИПИ ПРОЦЕСІВ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  COUNT(pt.id) as process_type_count,
  STRING_AGG(pt.name, ', ' ORDER BY pt.name) as process_type_names
FROM departments d
LEFT JOIN process_types pt ON pt.department_id = d.id
GROUP BY d.name
ORDER BY d.name;

-- ============================================
-- ЧАСТИНА 2: Перевірка зв'язків даних
-- ============================================

-- 2.1 Години роботи - чи належать користувачам з правильних підрозділів
SELECT '=== ГОДИНИ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  COUNT(h.id) as hours_count,
  SUM(h.hours) as total_hours,
  SUM(h.salary) as total_salary
FROM departments d
JOIN users u ON u.department_id = d.id
LEFT JOIN hours h ON h.user_id = u.id
GROUP BY d.name
ORDER BY d.name;

-- 2.2 Процеси - чи належать користувачам з правильних підрозділів
SELECT '=== ПРОЦЕСИ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  COUNT(p.id) as process_count,
  SUM(p.salary) as total_process_salary
FROM departments d
JOIN users u ON u.department_id = d.id
LEFT JOIN processes p ON p.user_id = u.id
GROUP BY d.name
ORDER BY d.name;

-- 2.3 Матеріали - чи належать користувачам з правильних підрозділів
SELECT '=== МАТЕРІАЛИ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  COUNT(m.id) as material_count,
  SUM(m.total_cost) as total_material_cost
FROM departments d
JOIN users u ON u.department_id = d.id
LEFT JOIN materials m ON m.user_id = u.id
GROUP BY d.name
ORDER BY d.name;

-- ============================================
-- ЧАСТИНА 3: Перевірка ізоляції (критично!)
-- ============================================

-- 3.1 Перевірка витоку даних між підрозділами
-- Шукаємо години, які належать користувачам не з того підрозділу, що об'єкт
SELECT '=== ПЕРЕВІРКА ВИТОКУ ДАНИХ (повинно бути 0 рядків) ===' as section;

-- 3.1.1 Перевірка годин - користувач VS об'єкт
SELECT
  'HOURS' as table_name,
  h.id as record_id,
  u.name as user_name,
  u.department_id as user_dept_id,
  h.object as object_name,
  o.department_id as object_dept_id,
  'USER і OBJECT з різних підрозділів!' as issue
FROM hours h
JOIN users u ON h.user_id = u.id
JOIN objects o ON h.object = o.name
WHERE u.department_id != o.department_id;

-- 3.1.2 Перевірка процесів - користувач VS об'єкт
SELECT
  'PROCESSES' as table_name,
  p.id as record_id,
  u.name as user_name,
  u.department_id as user_dept_id,
  p.object as object_name,
  o.department_id as object_dept_id,
  'USER і OBJECT з різних підрозділів!' as issue
FROM processes p
JOIN users u ON p.user_id = u.id
JOIN objects o ON p.object = o.name
WHERE u.department_id != o.department_id
  AND p.object IS NOT NULL;

-- 3.1.3 Перевірка матеріалів - користувач VS об'єкт
SELECT
  'MATERIALS' as table_name,
  m.id as record_id,
  u.name as user_name,
  u.department_id as user_dept_id,
  m.object as object_name,
  o.department_id as object_dept_id,
  'USER і OBJECT з різних підрозділів!' as issue
FROM materials m
JOIN users u ON m.user_id = u.id
JOIN objects o ON m.object = o.name
WHERE u.department_id != o.department_id;

-- ============================================
-- ЧАСТИНА 4: Тестування фільтрації API
-- ============================================

-- 4.1 Симуляція запиту getAllUsers для підрозділу "фасад"
SELECT '=== SIMULATION: getAllUsers(facade_dept_id) ===' as section;
SELECT id, name, role, level, department_id
FROM users
WHERE department_id = (SELECT id FROM departments WHERE name = 'фасад')
ORDER BY name;

-- 4.2 Симуляція запиту getAllObjects для підрозділу "столярні вироби"
SELECT '=== SIMULATION: getAllObjects(carpentry_dept_id) ===' as section;
SELECT id, name, is_business_trip, department_id
FROM objects
WHERE department_id = (SELECT id FROM departments WHERE name = 'столярні вироби')
ORDER BY name;

-- 4.3 Симуляція запиту getAllHours для користувачів підрозділу "стіни"
SELECT '=== SIMULATION: getAllHours(walls_dept_users) ===' as section;
SELECT h.id, h.user_id, u.name as user_name, h.date, h.hours, h.object
FROM hours h
JOIN users u ON h.user_id = u.id
WHERE h.user_id IN (
  SELECT id FROM users WHERE department_id = (
    SELECT id FROM departments WHERE name = 'стіни'
  )
)
ORDER BY h.date DESC
LIMIT 10;

-- ============================================
-- ЧАСТИНА 5: Статистика продуктивності
-- ============================================

-- 5.1 Розмір даних по підрозділах (приблизно)
SELECT '=== РОЗМІР ДАНИХ ПО ПІДРОЗДІЛАХ ===' as section;
SELECT
  d.name as department_name,
  (
    SELECT COUNT(*) FROM users WHERE department_id = d.id
  ) as users_count,
  (
    SELECT COUNT(*) FROM objects WHERE department_id = d.id
  ) as objects_count,
  (
    SELECT COUNT(*) FROM hours h
    JOIN users u ON h.user_id = u.id
    WHERE u.department_id = d.id
  ) as hours_count,
  (
    SELECT COUNT(*) FROM processes p
    JOIN users u ON p.user_id = u.id
    WHERE u.department_id = d.id
  ) as processes_count,
  (
    -- Приблизний розмір в KB (дуже грубо)
    (SELECT COUNT(*) FROM users WHERE department_id = d.id) * 0.2 +
    (SELECT COUNT(*) FROM objects WHERE department_id = d.id) * 0.1 +
    (SELECT COUNT(*) FROM hours h JOIN users u ON h.user_id = u.id WHERE u.department_id = d.id) * 0.3 +
    (SELECT COUNT(*) FROM processes p JOIN users u ON p.user_id = u.id WHERE u.department_id = d.id) * 0.5
  )::NUMERIC(10,2) as approx_size_kb
FROM departments d
ORDER BY d.name;

-- 5.2 Перевірка індексів
SELECT '=== ІНДЕКСИ ДЛЯ ОПТИМІЗАЦІЇ ===' as section;
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE 'idx_%department_id'
    OR indexname LIKE 'idx_%user_id'
    OR indexname LIKE 'idx_%employee_id'
    OR indexname LIKE 'idx_%manager_id'
  )
ORDER BY tablename, indexname;

-- ============================================
-- ПІДСУМОК
-- ============================================

SELECT '=== ПІДСУМОК ТЕСТУВАННЯ ===' as section;
SELECT
  'Всього підрозділів' as metric,
  COUNT(*)::TEXT as value
FROM departments
UNION ALL
SELECT
  'Всього користувачів',
  COUNT(*)::TEXT
FROM users
UNION ALL
SELECT
  'Всього об''єктів',
  COUNT(*)::TEXT
FROM objects
UNION ALL
SELECT
  'Всього годин',
  COUNT(*)::TEXT
FROM hours
UNION ALL
SELECT
  'Всього процесів',
  COUNT(*)::TEXT
FROM processes
UNION ALL
SELECT
  'Порушень ізоляції (повинно бути 0)',
  (
    SELECT COUNT(*)::TEXT FROM (
      SELECT h.id FROM hours h
      JOIN users u ON h.user_id = u.id
      JOIN objects o ON h.object = o.name
      WHERE u.department_id != o.department_id
      UNION ALL
      SELECT p.id FROM processes p
      JOIN users u ON p.user_id = u.id
      JOIN objects o ON p.object = o.name
      WHERE u.department_id != o.department_id AND p.object IS NOT NULL
      UNION ALL
      SELECT m.id FROM materials m
      JOIN users u ON m.user_id = u.id
      JOIN objects o ON m.object = o.name
      WHERE u.department_id != o.department_id
    ) violations
  );
