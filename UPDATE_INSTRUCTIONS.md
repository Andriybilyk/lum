# Інструкція з оновлення Google Sheets

## Зміни в структурі таблиць

Для коректної роботи з об'єктами та процесами, потрібно оновити структуру Google таблиці та Apps Script.

### 1. Оновіть структуру таблиці Processes

**Стара структура (A1:G1):**
- ID | UserID | Date | ProcessName | Volume | Unit | Salary

**Нова структура (A1:H1):**
- ID | UserID | Date | ProcessName | **Object** | Volume | Unit | Salary

**Що зробити:**
1. Відкрийте аркуш "Processes"
2. Вставте нову колонку між "ProcessName" (D) і "Volume" (E)
3. Назвіть нову колонку E1: **Object**
4. Тепер колонки мають бути: ID | UserID | Date | ProcessName | Object | Volume | Unit | Salary

### 2. Оновіть структуру таблиці ProcessTypes

**Стара структура (A1:D1):**
- ID | Name | Rate | Unit

**Нова структура (A1:F1):**
- ID | Name | **Object** | Rate | Unit | **PlannedVolume**

**Що зробити:**
1. Відкрийте аркуш "ProcessTypes"
2. Вставте нову колонку між "Name" (B) і "Rate" (C), назвіть її: **Object**
3. Додайте колонку F1: **PlannedVolume**
4. Тепер колонки: ID | Name | Object | Rate | Unit | PlannedVolume

### 3. Перевірте структуру таблиці Objects

**Має бути (A1:C1):**
- ID | Name | **IsBusinessTrip**

Якщо колонки IsBusinessTrip немає - додайте її в C1.

### 4. Оновіть Google Apps Script

1. У таблиці: **Extensions** → **Apps Script**
2. Знайдіть функцію `handleUpdateEntry`
3. Замініть секцію для Processes на:

```javascript
} else if (sheetName === 'Processes') {
  // Processes: ID | UserID | Date | ProcessName | Object | Volume | Unit | Salary
  sheet.getRange(rowIndex + 1, 3).setValue(newData.date);
  sheet.getRange(rowIndex + 1, 4).setValue(newData.processName);
  sheet.getRange(rowIndex + 1, 5).setValue(newData.object || '');
  sheet.getRange(rowIndex + 1, 6).setValue(newData.volume);
  sheet.getRange(rowIndex + 1, 7).setValue(newData.unit);
  sheet.getRange(rowIndex + 1, 8).setValue(newData.salary);
  Logger.log('Updated Processes entry');
}
```

4. Збережіть зміни (Ctrl+S)
5. **Deploy** → **Manage deployments**
6. Клікніть на іконку редагування (олівець) поряд з активним деплоєм
7. **Version:** Оберіть "New version"
8. **Deploy**

### 5. Перевірка

Після оновлення:
1. Перезавантажте додаток
2. Спробуйте створити процес на об'єкті
3. Відредагуйте процес - об'єкт повинен зберігатися
4. Перевірте, що процеси фільтруються за об'єктами

## Переваги після оновлення

✅ Всі зміни автоматично синхронізуються з Google Sheets
✅ Процеси прив'язуються до об'єктів
✅ При виборі об'єкту показуються тільки його процеси
✅ Немає потреби в ручній синхронізації
✅ Дані завжди актуальні

## Примітка

Повний код Google Apps Script доступний у файлі `GOOGLE_APPS_SCRIPT.md`

---

# Перевірка відображення даних про години та процеси

## Проблема

Години та процеси не відображаються в списку команди менеджера або у деталях працівника, хоча дані є в таблиці.

## Причини можливої проблеми

1. **User ID не відповідає** - ID користувача у таблиці "Hours" або "Processes" відрізняється від ID у таблиці "Users"
2. **Формат дати** - дата повинна бути у форматі `YYYY-MM-DD` (наприклад, `2024-11-13`)
3. **Пробіли чи спеціальні символи** - можуть виникнути в ID при копіюванні

## Як перевірити

### Крок 1: Відкрийте браузер (F12) Console

1. Відкрийте додаток у браузері
2. Натисніть F12 для відкриття Developer Tools
3. Перейдіть на вкладку **Console**

### Крок 2: Перезавантажте сторінку

Натисніть F5 і дивіться Console для логів. Повинні побачити такі логи:

```
📊 Raw users data from sheet: [...]
🔍 User ID processing (first row): {...}
✅ Loaded users: N, [...]

📊 Raw hours data from sheet: [...]
🔍 Hours ID processing (first row): {...}
✅ Loaded hours: M, [...]

📊 Raw processes data from sheet: [...]
🔍 Process ID processing (first row): {...}
✅ Loaded processes: K, [...]
```

### Крок 3: Перевірте відповідність ID

Порівняйте в логах:
- **Users**: `cleaned id` - це ID працівника
- **Hours**: `cleaned userId` - цей ID повинен точно збігатися з ID з Users
- **Processes**: `cleaned userId` - цей ID повинен точно збігатися з ID з Users

### Приклад правильного логу:

```
User ID processing: {
  cleaned id: "1234567890",
  name: "Іван Петренко"
}

Hours ID processing: {
  cleaned userId: "1234567890",  ← ПОВИНЕН ЗБІГАТИСЯ З USER ID
  date: "2024-11-13"
}
```

### Крок 4: Перевірте формат дати

У логах `Hours ID processing` дата повинна бути у форматі `YYYY-MM-DD`:
- ✅ Правильно: `2024-11-13`, `2024-01-05`
- ❌ Неправильно: `13.11.2024`, `11/13/2024`, `13-11-2024`

### Крок 5: Перевірте тип даних

У JSON логах мають бути числові значення для:
- `hours`: число (наприклад, `8` або `4.5`)
- `salary`: число (наприклад, `400` або `200.5`)

Якщо це рядки або含有 пробіли - проблема в обробці.

## Як виправити

### Якщо ID не збігаються

1. Відкрийте Google Sheets таблицю
2. Перейдіть на аркуш "Users" і скопіюйте ID першого користувача (без пробілів)
3. На аркушах "Hours" і "Processes" замініть усі неправильні ID на коректні
4. Збережіть таблицю

### Якщо дати у неправильному форматі

1. На аркушах "Hours" і "Processes" виберіть колонку з датами
2. Виберіть **Format** → **Number** → **Custom date and time** → `YYYY-MM-DD`
3. Видаліть та заново введіть дати або використайте функцію автоформатування

### Якщо є пробіли в ID

1. На аркушах "Hours" та "Processes" виберіть колонку UserID
2. Виберіть **Data** → **Text to columns** → **Space** як роздільник
3. Або вручну видаліть пробіли з кожного ID

## Після виправлення

1. Перезавантажте додаток (F5)
2. Дивіться Console для нових логів
3. Дані повинні бути видимі в:
   - Деталях працівника (Години/Процеси)
   - У списку команди менеджера (статистика по кожному працівнику)
   - На дашборді (загальні показники)

## Додаткові поради

### Для менеджерів

Переконайтесь, що при додаванні працівника до команди через кнопку "➕ Додати Працівника":
1. Працівник з'явиться у списку команди
2. Його `managerId` буде встановлено
3. Його дані синхронізуються з Google Sheets

Перевіримо це в Console:
```javascript
// Знайти усіх працівників менеджера
const manager = users.find(u => u.role === 'manager' && u.name === 'Ім\'я менеджера');
const teamMembers = users.filter(u => u.managerId === manager.id);
console.log('Команда менеджера:', teamMembers);
```
