# Google Sheets Інтеграція для Telegram Mini App

## 📋 Огляд

Всі Telegram API endpoints інтегровані з Google Sheets для персистентного збереження даних про користувачів та їхні години роботи.

## 🏗️ Архітектура

```
Telegram Mini App (Frontend)
        ↓
/api/telegram/* (Vercel API)
        ↓
Google Apps Script (Google Drive)
        ↓
Google Sheets (База даних)
```

## 📊 Інтегровані Endpoints

### 1. `/api/telegram/sync` - Синхронізація даних

**Функція:** Зберігає масив hours entries в Google Sheets

**Запит:**
```javascript
POST /api/telegram/sync
Headers: X-Telegram-User-ID: 123456789
Body: {
  userId: "123456789",
  entries: [
    { date: "2024-11-18", hours: 8, synced: "pending", id: "entry-1" },
    { date: "2024-11-17", hours: 6, synced: "pending", id: "entry-2" }
  ],
  timestamp: "2024-11-18T10:30:00Z"
}
```

**Процес:**
1. Валідує запит та user ID
2. Фільтрує валідні entries (дата, hours > 0)
3. Форматує дані для Google Sheets (додає timestamp, userId, тип джерела)
4. Відправляє payload до Google Apps Script
5. Google Apps Script додає дані в табличку "Hours"
6. Повертає результат з інформацією про синхронізацію

**Відповідь:**
```json
{
  "success": true,
  "message": "Successfully processed 2 entries",
  "syncedAt": "2024-11-18T10:30:00Z",
  "entriesSynced": 2,
  "googleSheetsSynced": true
}
```

### 2. `/api/telegram/hours` - CRUD операції з годинами

#### GET - Отримати години користувача
```javascript
GET /api/telegram/hours?month=2024-11
Headers: X-Telegram-User-ID: 123456789
```

**Відповідь:**
```json
{
  "success": true,
  "userId": "123456789",
  "entries": [...],
  "total": 160
}
```

#### POST - Додати нові години
```javascript
POST /api/telegram/hours
Headers: X-Telegram-User-ID: 123456789
Body: {
  hours: 8,
  date: "2024-11-18",
  notes: "Project development"
}
```

**Процес:**
1. Валідує hours > 0
2. Використовує поточну дату як замовчування
3. Fordwards до Google Apps Script
4. Google Apps Script додає запис в табличку "Hours"

**Відповідь:**
```json
{
  "success": true,
  "entry": { ... },
  "googleSheetsSynced": true
}
```

#### PUT - Оновити години
```javascript
PUT /api/telegram/hours
Body: {
  date: "2024-11-18",
  hours: 10,
  notes: "Updated"
}
```

#### DELETE - Видалити години
```javascript
DELETE /api/telegram/hours?date=2024-11-18
```

### 3. `/api/telegram/users` - Управління користувачами

#### POST - Створити користувача
```javascript
POST /api/telegram/users
Headers: X-Telegram-User-ID: 123456789
Body: {
  firstName: "Іван",
  lastName: "Петренко",
  username: "ivan_petrenko"
}
```

**Процес:**
1. Валідує firstName
2. Створює об'єкт користувача з timestamp
3. Відправляє до Google Apps Script
4. Google Apps Script додає в табличку "Users"

**Відповідь:**
```json
{
  "success": true,
  "user": { ... },
  "googleSheetsSynced": true
}
```

## 🗄️ Структура Google Sheets

### Табличка "Hours"
```
Columns: A  B        C         D      E              F
        |Timestamp|UserId|   Date   |Hours|Entry ID|Source|
        |2024-..  |123456|2024-11-18|  8  |entry-1 |telegram|
        |2024-..  |123456|2024-11-17|  6  |entry-2 |telegram|
```

### Табличка "Users"
```
Columns: A       B          C         D        E         F
        |UserId |FirstName |LastName |Username|CreatedAt |Source |
        |123456 |Іван      |Петренко |ivan_pet|2024-11..|telegram|
```

## 🔌 Google Apps Script

Потрібен Google Apps Script для обробки запитів від API:

```javascript
// В Google Apps Script
function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet();

  if (payload.action === 'append') {
    const tab = sheet.getSheetByName(payload.range.split('!')[0]);
    tab.appendRow(payload.values[0]);
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data appended'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## ⚙️ Конфігурація

### Необхідні змінні середовища

```env
# .env або .env.local
VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
VITE_GOOGLE_API_KEY=YOUR_API_KEY (опціонально для прямих запитів)
```

### Верification на Vercel

Додайте змінні в Vercel dashboard:
1. Project Settings → Environment Variables
2. Додайте `VITE_GOOGLE_SCRIPT_URL` та `VITE_SPREADSHEET_ID`

## 📡 Потік даних

### Додавання годин через Telegram Mini App

```
1. User додає 8 годин в мініапп
   ↓
2. Frontend зберігає локально в localStorage
   ↓
3. Frontend викликає telegramSync.addHours()
   ↓
4. По таймеру або при успіху - викликає /api/telegram/sync
   ↓
5. API валідує, форматує та відправляє до Google Apps Script
   ↓
6. Google Apps Script додає дані в Google Sheets
   ↓
7. Frontend отримує підтвердження та позначає як synced
```

## 🔒 Безпека

### Поточна реалізація
- ✅ Базова валідація User ID в headers
- ✅ Типізація даних
- ⚠️ Потребує:
  - Верифікація Telegram initData HMAC підпис
  - Rate limiting на endpoints
  - Логування всіх операцій

### Рекомендовані покращення
```typescript
// Додати верифікацію підпису Telegram
import crypto from 'crypto';

function verifyTelegramInitData(initData: string, botToken: string): boolean {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  const dataCheckString = Array.from(params)
    .filter(([key]) => key !== 'hash')
    .sort()
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(botToken).digest();

  const checkHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString).digest('hex');

  return checkHash === hash;
}
```

## 🧪 Тестування

### cURL приклади

**Додати години:**
```bash
curl -X POST http://localhost:5173/api/telegram/hours \
  -H "Content-Type: application/json" \
  -H "X-Telegram-User-ID: 123456789" \
  -d '{
    "hours": 8,
    "date": "2024-11-18",
    "notes": "Development"
  }'
```

**Синхронізувати дані:**
```bash
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

## 📈 Моніторинг

### Логи для відстеження

Кожен endpoint логує:
- User ID що запит робив
- Тип операції (append, read, delete)
- Успіх/невдача синхронізації з Google Sheets
- Timestamp операції

**Приклад логу:**
```
[Telegram Sync] Syncing 2 entries for user 123456789
[Telegram Sync] Processing 2 valid entries for user 123456789
[Telegram Sync] Forwarding 2 entries to Google Sheets for user 123456789
[Telegram Sync] Successfully appended 2 entries to Google Sheets
```

## ⚡ Оптимізація

### Кешування
- GET запити можна кешувати на 5-15 хвилин
- Кеш інвалідується після POST/PUT/DELETE

### Батчування
- Синхронізація відправляє дані батчами по 50-100 записів
- Зменшує кількість Google Apps Script запитів

### Rate Limiting
```typescript
// Додати rate limiting
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimiter.get(userId) || [];
  const recentRequests = userRequests.filter(t => now - t < 60000);

  if (recentRequests.length > 10) return false; // Max 10 запитів в хвилину

  recentRequests.push(now);
  rateLimiter.set(userId, recentRequests);
  return true;
}
```

## 🔄 Наступні кроки

1. **Реалізувати читання з Google Sheets**
   - Додати GET обробники для hours та users
   - Кешувати дані на клієнті

2. **Верифікація Telegram initData**
   - Перевіряти HMAC підпис
   - Валідувати auth_date

3. **Розширена аналітика**
   - Графіки в Google Sheets
   - Звіти про продуктивність

4. **Інтеграція з хмарою**
   - Backup в хмарне сховище
   - Реплікація в інші сервіси

## 📞 Підтримка

Для питань про інтеграцію див.:
- Google Apps Script API: https://developers.google.com/apps-script
- Google Sheets API: https://developers.google.com/sheets/api
- Telegram Bot API: https://core.telegram.org/bots
