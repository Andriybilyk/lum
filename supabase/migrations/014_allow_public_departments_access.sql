-- Дозволяємо доступ до списку підрозділів для анонімних користувачів
-- Це потрібно для форм реєстрації

-- Видаляємо стару політику
DROP POLICY IF EXISTS "Anyone can view departments" ON departments;

-- Створюємо нову політику для публічного читання
CREATE POLICY "Public can view departments"
  ON departments
  FOR SELECT
  TO public
  USING (true);

-- Коментар
COMMENT ON POLICY "Public can view departments" ON departments IS 'Дозволяє всім (включно з неаутентифікованими) читати список підрозділів для форм реєстрації';
