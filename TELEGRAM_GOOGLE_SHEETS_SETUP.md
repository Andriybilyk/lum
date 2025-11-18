# Telegram Mini App + Google Sheets - Повна інструкція налаштування

## 🎯 Що було зроблено

Ваш Telegram Mini App тепер має повну інтеграцію з Google Sheets для:
- ✅ Збереження даних про користувачів
- ✅ Реєстрації часу роботи
- ✅ Синхронізації з хмарою
- ✅ Offline-first архітектури

---

## 📊 Архітектура системи

```
┌─────────────────────────────────────────────────────────────┐
│                  Telegram Mini App                          │
│  (Фронтенд - React + TypeScript)                           │
│  - Додавання годин                                         │
│  - Перегляд статистики                                     │
│  - Локальне зберігання (localStorage)                      │
└─────────────────────────────────────────────────────────────┘
                        ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│              Vercel API (Бекенд)                            │
│  /api/telegram/sync    → Синхронізація даних               │
│  /api/telegram/hours   → CRUD операції з годинами          │
│  /api/telegram/users   → Управління користувачами          │
└─────────────────────────────────────────────────────────────┘
                        ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│         Google Apps Script (Middleware)                     │
│  - Додавання даних в Sheets                                │
│  - Обробка batch операцій                                  │
│  - Форматування даних                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓ API
┌─────────────────────────────────────────────────────────────┐
│           Google Sheets (База даних)                        │
│  - "Hours" табличка з записами часу                        │
│  - "Users" табличка з профілями                            │
│  - Всі дані синхронізовані в реальному часі                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Налаштування

### Крок 1: Підготовка Google Sheets

1. **Crear Google Spreadsheet**
   - Перейти на [sheets.google.com](https://sheets.google.com)
   - Створити новий документ
   - Назвати його "HR System - Telegram"

2. **Створити таблиці**

   **Таблиця "Hours":**
   ```
   Columns: Timestamp | UserId | Date | Hours | EntryID | Source
   ```

   **Таблиця "Users":**
   ```
   Columns: UserId | FirstName | LastName | Username | CreatedAt | Source
   ```

3. **Отримати Spreadsheet ID**
   - URL має вигляд: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
   - Копіювати SPREADSHEET_ID

### Крок 2: Створити Google Apps Script

1. **Відкрити Apps Script**
   - В Google Sheets: Tools → Script editor

2. **Додати код для обробки запитів**
   ```javascript
   // apps-script-code.gs
   function doPost(e) {
     try {
       const payload = JSON.parse(e.postData.contents);
       const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

       // Обробка append операцій
       if (payload.action === 'append') {
         const sheetName = payload.range.split('!')[0];
         const sheet = spreadsheet.getSheetByName(sheetName);

         if (sheet) {
           for (const row of payload.values) {
             sheet.appendRow(row);
           }
         }

         return ContentService.createTextOutput(JSON.stringify({
           success: true,
           message: `Added ${payload.values.length} rows to ${sheetName}`
         })).setMimeType(ContentService.MimeType.JSON);
       }

       return ContentService.createTextOutput(JSON.stringify({
         success: false,
         message: 'Unknown action'
       })).setMimeType(ContentService.MimeType.JSON);

     } catch (error) {
       Logger.log('Error: ' + error);
       return ContentService.createTextOutput(JSON.stringify({
         success: false,
         message: error.toString()
       })).setMimeType(ContentService.MimeType.JSON);
     }
   }
   ```

3. **Розгорнути як Web App**
   - Deploy → New deployment
   - Type: Web app
   - Execute as: (ваш email)
   - Who has access: Anyone
   - Скопіювати URL

### Крок 3: Додати змінні середовища

**На локальній машині** (`.env` або `.env.local`):
```env
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
VITE_GOOGLE_API_KEY=YOUR_API_KEY (опціонально)
```

**На Vercel** (Project Settings → Environment Variables):
```
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
```

### Крок 4: Налаштування Telegram Bot

1. **Отримати Bot Token**
   - Напишіть @BotFather в Telegram
   - `/newbot` → введіть ім'я боту
   - Скопіювати token

2. **Налаштувати Web App**
   - Менеджер ботів → Bot Username → Web App
   - Встановити URL вашого Vercel додатку

---

## 🚀 Використання

### Для користувачів (в Telegram Mini App)

1. **Додати години**
   - Натиснути на "Додати 0.5 годин", "1 година" або "2 години"
   - Дані автоматично зберігаються локально
   - При наявності інтернету синхронізуються в Google Sheets

2. **Перегляд статистики**
   - Видно сьогоднішні години
   - Видно прогрес за місяць (%)
   - Останні 7 днів діяльності

### Для розробників

**Синхронізація в коді:**
```typescript
import { telegramApi } from '@/services/telegramApi';

// Додати години
await telegramApi.addHours('123456789', 8, '2024-11-18');

// Отримати години
const hoursData = await telegramApi.getHours('123456789', '2024-11');

// Синхронізувати усе
await telegramApi.syncHours({
  userId: '123456789',
  entries: [
    { date: '2024-11-18', hours: 8, synced: 'pending' },
  ],
  timestamp: new Date().toISOString()
});

// Управління користувачами
await telegramApi.createUser('123456789', {
  firstName: 'Іван',
  lastName: 'Петренко',
  username: 'ivan_petrenko'
});
```

---

## 📱 Потік роботи

### Оновлення інформації (Real-time)

```
1. User відкриває Telegram Mini App
   ↓
2. Telegram передає initData з user ID
   ↓
3. Frontend ініціалізує TelegramAppContext
   ↓
4. Завантажується локальна історія годин
   ↓
5. Кожні 30 сек: автоматична синхронізація в Google Sheets
   ↓
6. Google Apps Script додає дані в Sheets
   ↓
7. Data доступна в реальному часі для всіх користувачів
```

### Додавання годин

```
User натискає "Додати 8 годин"
↓
telegramSync.addHours() зберігає в localStorage
↓
Встановлюється статус "pending"
↓
Вражає на /api/telegram/sync
↓
API валідує, форматує та відправляє до Google Apps Script
↓
Google Apps Script додає в "Hours" таблицю
↓
Frontend позначає запис як "synced"
↓
User бачить оновлену статистику
```

---

## 🔐 Безпека

### Поточна реалізація

✅ **Доступно:**
- Валідація User ID в headers
- Типізація даних
- Логування операцій
- Graceful error handling

⚠️ **Потребує покращення:**

1. **Верифікація Telegram initData**
   ```typescript
   // Додати в /api/telegram endpoints
   import crypto from 'crypto';

   function verifyTelegramInitData(initData: string, botToken: string) {
     const params = new URLSearchParams(initData);
     const hash = params.get('hash');
     // ... verifikace HMAC-SHA256
   }
   ```

2. **Rate Limiting**
   ```typescript
   // Максимум 10 запитів/хвилину від користувача
   // Максимум 100 запитів/хвилину від IP адреси
   ```

3. **HTTPS only**
   - Vercel автоматично включає HTTPS
   - Google Apps Script також HTTPS

---

## 🧪 Тестування

### Тест синхронізації локально

```bash
# 1. Стартовать dev сервер
npm run dev

# 2. Відкрити в браузері
# http://localhost:5173/telegram

# 3. Додати години через UI

# 4. Перевірити Network tab (F12)
# Повинна бути POST запит до /api/telegram/sync

# 5. Перевірити Google Sheets
# Дані повинні з'явитися в "Hours" таблиці
```

### cURL тесті

```bash
# Добавить часы
curl -X POST http://localhost:5173/api/telegram/hours \
  -H "Content-Type: application/json" \
  -H "X-Telegram-User-ID: 123456789" \
  -d '{
    "hours": 8,
    "date": "2024-11-18",
    "notes": "Test entry"
  }'

# Синхронізувати
curl -X POST http://localhost:5173/api/telegram/sync \
  -H "Content-Type: application/json" \
  -H "X-Telegram-User-ID: 123456789" \
  -d '{
    "userId": "123456789",
    "entries": [
      {"date": "2024-11-18", "hours": 8, "synced": "pending"}
    ],
    "timestamp": "2024-11-18T10:30:00Z"
  }'
```

---

## 📈 Моніторинг та Логи

### Логи синхронізації

Кожна операція логується з деталями:

```
[Telegram Sync] Syncing 2 entries for user 123456789
[Telegram Sync] Processing 2 valid entries
[Telegram Sync] Forwarding to Google Sheets
[Telegram Sync] Successfully appended 2 entries to Google Sheets
```

### Перегляд логів

**Локально:**
- Відкрити DevTools (F12)
- Console tab → фільтр `[Telegram`

**На Vercel:**
- Deployments → Logs
- Фільтр по `[Telegram`

---

## 🎯 Next Steps

### Найближчі покращення (Priority: HIGH)

1. **Верифікація Telegram initData**
   - Перевіряти HMAC підпис
   - Валідувати auth_date

2. **읽기 з Google Sheets**
   - GET endpoints для витягування даних
   - Кешування на клієнті

3. **Rate limiting**
   - Запобігання абузу
   - Контроль API квоти

### Середньострокові (Priority: MEDIUM)

1. **Розширена аналітика**
   - Графіки в Google Sheets
   - Звіти продуктивності

2. **Інтеграція з Supabase**
   - Backup дані
   - Real-time синхронізація

3. **Admin panel**
   - Управління користувачами
   - Перегляд статистики

### Довгострокові (Priority: LOW)

1. **API Keys management**
2. **Advanced reporting**
3. **Mobile app версія**
4. **Multi-language support**

---

## 📞 Troubleshooting

### Проблема: Дані не синхронізуються

**Перевірте:**
1. Чи встановлені `VITE_GOOGLE_SCRIPT_URL` та `VITE_SPREADSHEET_ID`?
2. Чи Vercel має доступ до цих змінних?
3. Чи Google Apps Script розгорнутий як Web App?
4. Чи правильна URL Google Apps Script?

### Проблема: "offline" статус

**Рішення:**
- Це вже виправлено у попередніх оновленнях
- Перевірте що build актуальний: `npm run build`

### Проблема: 404 на API endpoints

**Перевірте:**
- Чи файли створені в `/api/telegram/`?
- Чи Vercel переавантажився після додавання нових файлів?

---

## 📚 Посилання

- [Google Apps Script API](https://developers.google.com/apps-script/api)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Telegram Bot API](https://core.telegram.org/bots)
- [Telegram Web App API](https://core.telegram.org/bots/webapps)
- [Vercel Documentation](https://vercel.com/docs)

---

## 🎉 Готово!

Ваш Telegram Mini App тепер повністю готовий до використання з Google Sheets як базою даних. Всі дані синхронізуються в реальному часі!

**Щоб почати:**
1. Налаштуйте Google Sheets (Крок 1-3 вище)
2. Розгорніть на Vercel
3. Відкрийте додаток в Telegram
4. Додайте години роботи

Успіхів! 🚀
