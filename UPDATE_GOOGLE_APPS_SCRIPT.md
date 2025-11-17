# Як оновити Google Apps Script

## Проблема

Google Apps Script скрипт не записує дані в Google Sheets. Потрібно оновити код скрипту.

## Рішення

### Крок 1: Відкрити Google Apps Script

1. Перейдіть на https://script.google.com
2. Відкрийте свій скрипт (він повинен бути прив'язаний до Google Sheets)

### Крок 2: Замінити код

1. Видаліть весь існуючий код в редакторі
2. Скопіюйте код з файлу `/GOOGLE_APPS_SCRIPT_CODE.gs` цього проекту
3. Вставте новий код у редактор

### Крок 3: Зберегти

1. Натисніть **Ctrl+S** або **⌘+S** (Mac)
2. Або натисніть меню **File** → **Save**

### Крок 4: Розгорнути

1. На верхній панелі натисніть **Deploy** (або **Редагувати розгортання** якщо вже розгорнуто)
2. Виберіть **New deployment**
3. Виберіть тип: **Web app**
4. За **Execute as:** оберіть ваш Google аккаунт
5. За **Who has access:** оберіть **Anyone**
6. Натисніть **Deploy**
7. Скопіюйте нову URL розгортання (вона буде новою, але структурою та різних ID)
8. Якщо URL змінилась, оновіть `VITE_GOOGLE_SCRIPT_URL` на Vercel

### Крок 5: Тестування

1. Закрийте Telegram мініапп (повністю)
2. Відкрийте його заново
3. Зареєструйте нового користувача
4. DevTools Console повинен показати: `✅ Append request successful`
5. Перевірте Google Sheets - новий рядок має з'явитися

## Що робить новий скрипт

```javascript
function doPost(e) {
  // 1. Парсить JSON з браузера
  const payload = JSON.parse(e.postData.contents);

  // 2. Отримує Google Sheets ID, range та дані
  const spreadsheetId = payload.spreadsheetId;
  const range = payload.range;
  const values = payload.values;
  const action = payload.action;

  // 3. Якщо action = 'append':
  //    - Додає новий рядок у таблицю
  // 4. Якщо action = 'update':
  //    - Оновлює дані в таблиці

  // 5. Повертає JSON з результатом
  return ContentService.createTextOutput(...)
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Важливо

- **Розгортання (Deploy) ОБОВ'ЯЗКОВЕ!** Без цього браузер не матиме доступу до скрипту
- URL розгортання може змінитись при оновленні - перевірте на Vercel
- Скрипт повинен мати доступ до вашої Google Sheets таблиці

## Якщо все ще не працює

Перевірте:

1. **Google Sheets має документ з лістами:**
   - `Users` - з колонками A:F (ID, Name, Role, Level, HourlyRate, ManagerID)
   - `Hours`, `Processes`, і т.д.

2. **Google Apps Script має доступ до цієї таблиці:**
   - Таблиця мусить бути прив'язана до скрипту

3. **Vercel API отримує запити:**
   - DevTools Console повинен показати логи від API

4. **Перевірте логи Google Apps Script:**
   - На https://script.google.com
   - Меню **Execution log** (Журнал виконання)
   - Там будуть помилки якщо щось не працює
